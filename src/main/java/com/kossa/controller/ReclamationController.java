package com.kossa.controller;

import com.kossa.dto.DemandeEscaladeRequest;
import com.kossa.dto.ReclamationRequest;
import com.kossa.entity.*;
import com.kossa.repository.*;
import com.kossa.service.NotificationService;
import com.kossa.service.ReclamationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reclamations")
public class ReclamationController {

    @Autowired
    private ReclamationService reclamationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private EscaladeRepository escaladeRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private AgenceRepository agenceRepository;

    private Agence agenceDeLUtilisateur(Authentication auth) {
        Utilisateur user = utilisateurRepository.findByEmail(auth.getName()).orElse(null);
        return user != null ? user.getAgence() : null;
    }

    private boolean estAutoriseSansAgence(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> {
            String r = a.getAuthority();
            return "ROLE_ADMIN".equals(r)
                || "ROLE_GESTIONNAIRE".equals(r)
                || "ROLE_CHEF_AGENCE".equals(r)
                || "ROLE_SUPERVISEUR".equals(r)
                || "ROLE_CHEF_SAV".equals(r);
        });
    }

    private Agence agenceSelectionnee(Authentication auth, Long agenceIdHeader) {
        Agence maAgence = agenceDeLUtilisateur(auth);
        if (maAgence != null) return maAgence;
        if (agenceIdHeader != null) {
            Agence agenceHeader = agenceRepository.findById(agenceIdHeader).orElse(null);
            if (agenceHeader != null) return agenceHeader;
        }
        if (!estAutoriseSansAgence(auth)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : aucune agence sélectionnée.");
        }
        return null;
    }

    private void verifierAppartenanceAgence(Reclamation rec, Authentication auth, Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(auth, agenceIdHeader);
        if (agence != null && (rec.getAgence() == null || !rec.getAgence().getId().equals(agence.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : cette réclamation n'appartient pas à votre agence.");
        }
    }

    @GetMapping
    public ResponseEntity<List<Reclamation>> getAll(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        List<Reclamation> toutes = reclamationService.recupererToutesLesReclamations();
        if (authentication == null) {
            return ResponseEntity.ok(toutes);
        }
        String email = authentication.getName();
        Set<String> autorites = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toSet());

        if (autorites.contains("ROLE_CHARGE_RECLAMATION")) {
            List<Reclamation> filtrees = toutes.stream()
                    .filter(r -> r.getAgent() != null && email.equalsIgnoreCase(r.getAgent().getEmail()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(filtrees);
        }

        if (autorites.contains("ROLE_CHEF_SAV")) {
            String region = managerRepository.findByEmail(email)
                    .map(m -> m.getRegion()).orElse(null);
            List<Reclamation> filtrees = toutes.stream()
                    .filter(r -> (r.getChefSisav() != null && email.equalsIgnoreCase(r.getChefSisav().getEmail()))
                            || "ASSIGNE_SISAV".equals(r.getStatut()))
                    .filter(r -> region == null || region.isBlank()
                            || (r.getAgence() != null && region.equalsIgnoreCase(r.getAgence().getRegion())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(filtrees);
        }

        // MANAGER / GESTIONNAIRE / CHEF_SAV / ADMIN / SUPERVISEUR : filtre par agence si local
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            List<Reclamation> filtrees = toutes.stream()
                    .filter(r -> r.getAgence() != null && agence.getId().equals(r.getAgence().getId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(filtrees);
        }

        return ResponseEntity.ok(toutes);
    }

    @GetMapping("/status/{statut}")
    public ResponseEntity<List<Reclamation>> getByStatut(
            @PathVariable String statut,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        List<Reclamation> tickets = reclamationService.recupererTicketsParStatut(statut);
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            tickets = tickets.stream()
                    .filter(r -> r.getAgence() != null && agence.getId().equals(r.getAgence().getId()))
                    .toList();
        }
        return ResponseEntity.ok(tickets);
    }

    /** Statuts légalement atteignables depuis le statut courant (enchaînement strict du workflow). */
    @GetMapping("/statuts-suivants")
    public ResponseEntity<List<String>> getStatutsSuivants(@RequestParam String statut) {
        return ResponseEntity.ok(reclamationService.statutsSuivants(statut));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable Long id,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationService.recupererReclamationParId(id);
        if (authentication != null) {
            Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
            if (agence != null && (rec.getAgence() == null || !rec.getAgence().getId().equals(agence.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé : cette réclamation n'appartient pas à votre agence.");
            }
        }
        return ResponseEntity.ok(rec);
    }

    @PostMapping
    public ResponseEntity<Reclamation> create(@Valid @RequestBody ReclamationRequest request, Authentication authentication) {
        Reclamation nouvelle = reclamationService.creerReclamationAvecSla(
                request.getMsisdn(), request.getNom(), request.getPrenom(),
                request.getDescription(), request.getType(), request.getPriorite(),
                request.getCanalNom(), authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(nouvelle);
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<Reclamation> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationService.recupererReclamationParId(id);
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        String nouveauStatut = payload.get("statut");
        String commentaire = payload.get("commentaire");
        String planActionDesc = payload.get("planAction");

        if (payload.containsKey("affecteA") && payload.get("affecteA") != null && !payload.get("affecteA").isEmpty()) {
            throw new RuntimeException("L'affectation d'un agent est réservée au Manager. Merci de passer par l'affectation Manager.");
        }

        Reclamation updated = reclamationService.traiterReclamation(id, nouveauStatut, commentaire, planActionDesc, null, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reclamation> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationService.recupererReclamationParId(id);
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Reclamation updated = reclamationService.mettreAJourReclamation(
                id,
                payload.get("description"),
                payload.get("priorite"),
                payload.get("canalNom")
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Set<String> autorites = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority()).collect(Collectors.toSet());
        if (!autorites.contains("ROLE_ADMIN") && !autorites.contains("ROLE_CHEF_AGENCE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Seuls les admins et managers peuvent supprimer des réclamations.");
        }
        Reclamation rec = reclamationService.recupererReclamationParId(id);
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null && (rec.getAgence() == null || !rec.getAgence().getId().equals(agence.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé : cette réclamation n'appartient pas à votre agence.");
        }
        reclamationService.supprimerReclamation(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/batch")
    public ResponseEntity<?> deleteBatch(
            @RequestBody List<Long> ids,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Set<String> autorites = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority()).collect(Collectors.toSet());
        if (!autorites.contains("ROLE_ADMIN") && !autorites.contains("ROLE_CHEF_AGENCE")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Seuls les admins et managers peuvent supprimer des réclamations.");
        }
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            List<Long> autorises = ids.stream().filter(id -> {
                Reclamation r = reclamationService.recupererReclamationParId(id);
                return r.getAgence() != null && agence.getId().equals(r.getAgence().getId());
            }).toList();
            reclamationService.supprimerReclamations(autorises);
        } else {
            reclamationService.supprimerReclamations(ids);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Reclamation>> search(
            @RequestParam String keyword,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        List<Reclamation> resultats = reclamationService.rechercherParMotCle(keyword);
        if (authentication == null) {
            return ResponseEntity.ok(resultats);
        }
        String email = authentication.getName();
        Set<String> autorites = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toSet());
        List<Reclamation> filtrees;
        if (autorites.contains("ROLE_CHARGE_RECLAMATION")) {
            filtrees = resultats.stream()
                    .filter(r -> r.getAgent() != null && email.equalsIgnoreCase(r.getAgent().getEmail()))
                    .collect(Collectors.toList());
        } else         if (autorites.contains("ROLE_CHEF_AGENCE")) {
            Long agenceId = utilisateurRepository.findByEmail(email)
                    .map(u -> u.getAgence() != null ? u.getAgence().getId() : null)
                    .orElse(null);
            filtrees = resultats.stream()
                    .filter(r -> agenceId != null && r.getAgence() != null && agenceId.equals(r.getAgence().getId()))
                    .collect(Collectors.toList());
        } else if (autorites.contains("ROLE_CHEF_SAV")) {
            String region = managerRepository.findByEmail(email)
                    .map(m -> m.getRegion()).orElse(null);
            filtrees = resultats.stream()
                    .filter(r -> (r.getChefSisav() != null && email.equalsIgnoreCase(r.getChefSisav().getEmail()))
                            || "ASSIGNE_SISAV".equals(r.getStatut()))
                    .filter(r -> region == null || region.isBlank()
                            || (r.getAgence() != null && region.equalsIgnoreCase(r.getAgence().getRegion())))
                    .collect(Collectors.toList());
        } else {
            Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
            if (agence != null) {
                filtrees = resultats.stream()
                        .filter(r -> r.getAgence() != null && agence.getId().equals(r.getAgence().getId()))
                        .collect(Collectors.toList());
            } else {
                filtrees = resultats;
            }
        }
        return ResponseEntity.ok(filtrees);
    }

    @GetMapping("/agents")
    public ResponseEntity<List<Map<String, Object>>> getAgents(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        List<Utilisateur> agents = utilisateurRepository.findByRole("ROLE_CHARGE_RECLAMATION");
        if (authentication != null) {
            Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
            if (agence != null) {
                agents = agents.stream()
                        .filter(a -> a.getAgence() != null && agence.getId().equals(a.getAgence().getId()))
                        .collect(Collectors.toList());
            }
        }
        List<Object[]> comptages = reclamationRepository.compterTicketsParAgent();
        Map<String, Long> mapComptage = new HashMap<>();
        for (Object[] row : comptages) {
            mapComptage.put((String) row[1], (Long) row[2]);
        }
        List<Map<String, Object>> result = agents.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("email", a.getEmail());
            m.put("nom", a.getNom());
            m.put("nbTickets", mapComptage.getOrDefault(a.getNom(), 0L));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/demander-escalade")
    public ResponseEntity<Escalade> demanderEscalade(
            @PathVariable Long id,
            @Valid @RequestBody DemandeEscaladeRequest request,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        boolean dejaDemandee = rec.getEscalades() != null && rec.getEscalades().stream()
                .anyMatch(e -> "DEMANDE".equals(e.getStatut()));
        if (dejaDemandee) {
            throw new RuntimeException("Une demande d'escalade est déjà en attente de validation pour ce ticket");
        }

        Escalade escalade = new Escalade();
        escalade.setNiveau("N2");
        escalade.setStatut("DEMANDE");
        escalade.setMotif(request.getMotif());
        escalade.setDateEscalade(new Date());
        escalade.setReclamation(rec);
        escaladeRepository.save(escalade);

        reclamationService.traiterReclamation(
                id, "ESCALADE_" + escalade.getNiveau(),
                "Demande d'escalade " + escalade.getNiveau() + " demandée par l'agent. Motif: " + request.getMotif(),
                null, null, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED).body(escalade);
    }

    /** Soumet le ticket à la validation du Superviseur (dérogation, remboursement, geste commercial). */
    @PostMapping("/{id}/demander-validation-superviseur")
    public ResponseEntity<Reclamation> demanderValidationSuperviseur(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);
        String motif = body != null && body.get("motif") != null
                ? body.get("motif") : "Dérogation / remboursement soumis au Superviseur";
        Reclamation updated = reclamationService.traiterReclamation(
                id, "EN_ATTENTE_SUPERVISEUR", motif, null, null, authentication.getName());
        notificationService.notifierValidation(updated, "soumise à la validation du Superviseur", null);
        return ResponseEntity.ok(updated);
    }
}
