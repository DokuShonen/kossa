package com.kossa.controller;

import com.kossa.dto.*;
import com.kossa.entity.*;
import com.kossa.repository.*;
import com.kossa.service.ReclamationService;
import com.kossa.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('CHEF_AGENCE', 'GESTIONNAIRE', 'CHEF_SAV', 'SUPERVISEUR')")
public class ManagerController {

    @Autowired private ReclamationRepository reclamationRepository;
    @Autowired private EscaladeRepository escaladeRepository;
    @Autowired private ManagerRepository managerRepository;
    @Autowired private AgentRepository agentRepository;
    @Autowired private EquipeSupportRepository equipeSupportRepository;
    @Autowired private CommentaireRepository commentaireRepository;
    @Autowired private AgenceRepository agenceRepository;
    @Autowired private HistoriqueTicketRepository historiqueTicketRepository;
    @Autowired private ReclamationService reclamationService;
    @Autowired private NotificationService notificationService;
    @Autowired private UtilisateurRepository utilisateurRepository;

    private Agence agenceDeLUtilisateur(Authentication auth) {
        Utilisateur user = utilisateurRepository.findByEmail(auth.getName()).orElse(null);
        return user != null ? user.getAgence() : null;
    }

    private boolean estAutoriseSansAgence(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> {
            String r = a.getAuthority();
            return "ROLE_ADMIN".equals(r) || "ROLE_CHEF_AGENCE".equals(r) || "ROLE_GESTIONNAIRE".equals(r);
        });
    }

    private Agence agenceSelectionnee(Authentication auth, Long agenceIdHeader) {
        Agence maAgence = agenceDeLUtilisateur(auth);
        if (maAgence != null) return maAgence;
        if (agenceIdHeader != null) {
            return agenceRepository.findById(agenceIdHeader).orElse(null);
        }
        return null;
    }

    private void verifierAppartenanceAgence(Reclamation rec, Authentication auth, Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(auth, agenceIdHeader);
        if (agence == null && !estAutoriseSansAgence(auth)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : aucune agence sélectionnée.");
        }
        if (agence != null && (rec.getAgence() == null || !rec.getAgence().getId().equals(agence.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : cette réclamation n'appartient pas à votre agence.");
        }
    }

    @GetMapping("/reclamations")
    public ResponseEntity<Page<Reclamation>> listerTickets(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String priorite,
            @RequestParam(required = false) String type,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader,
            Pageable pageable) {

        String role = authentication.getAuthorities().stream()
                .findFirst().map(a -> a.getAuthority()).orElse("");

        // CHEF_SAV : voit les réclamations SISAV de son agence
        if ("ROLE_CHEF_SAV".equals(role)) {
            Manager chefSav = managerRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Chef SAV non trouvé"));
            Agence agenceChef = chefSav.getAgence();
            List<Reclamation> sisav;
            if (agenceChef != null) {
                sisav = reclamationRepository.findByAgence_IdAndSisav(agenceChef.getId(), authentication.getName());
            } else {
                sisav = reclamationRepository.findBySisav(authentication.getName());
            }
            Page<Reclamation> tickets = new org.springframework.data.domain.PageImpl<>(
                    sisav.stream()
                            .filter(r -> statut == null || statut.isEmpty() || statut.equals(r.getStatut()))
                            .collect(java.util.stream.Collectors.toList()));
            return ResponseEntity.ok(tickets);
        }

        // MANAGER / CHEF_SAV : filtre par agence (auto-détectée ou header)
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            Page<Reclamation> tickets;
            if (statut != null && !statut.isEmpty()) {
                tickets = reclamationRepository.findByAgence_IdAndStatut(agence.getId(), statut, pageable);
            } else {
                tickets = reclamationRepository.findByAgence_Id(agence.getId(), pageable);
            }
            return ResponseEntity.ok(tickets);
        }

        // MANAGER global sans agence : voit toutes les réclamations
        Page<Reclamation> tickets;
        org.springframework.data.domain.Pageable trie = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(),
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "dateCreation"));
        if (statut != null && !statut.isEmpty()) {
            tickets = reclamationRepository.findByStatut(statut, trie);
        } else {
            tickets = reclamationRepository.findAll(trie);
        }
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/reclamations/{id}")
    public ResponseEntity<?> detailTicket(
            @PathVariable Long id,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationService.recupererReclamationParId(id);
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null && (rec.getAgence() == null || !rec.getAgence().getId().equals(agence.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé : cette réclamation n'appartient pas à votre agence.");
        }
        return ResponseEntity.ok(rec);
    }

    @PutMapping("/reclamations/{id}/statut")
    public ResponseEntity<Reclamation> mettreAJourStatut(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Reclamation traitement = reclamationService.traiterReclamation(
                id, request.getStatut(),
                request.getCommentaire() != null ? request.getCommentaire() : "Statut mis à jour par le Manager",
                null, null, authentication.getName());
        return ResponseEntity.ok(traitement);
    }

    @PutMapping("/reclamations/{id}/assigner")
    public ResponseEntity<Reclamation> assignerAgent(
            @PathVariable Long id,
            @Valid @RequestBody AssignerRequest request,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Agent agent = agentRepository.findByEmail(request.getAgentEmail())
                .orElseThrow(() -> new RuntimeException("Agent introuvable"));

        reclamationService.verifierCompetenceDomaine(rec, agent);

        Reclamation traitement = reclamationService.traiterReclamation(
                id, "ASSIGNE",
                "Réclamation assignée par le Manager à l'agent: " + agent.getNom()
                        + " (équipe " + (agent.getEquipeSupport() != null ? agent.getEquipeSupport().getNom() : "non définie") + ")",
                null, request.getAgentEmail(), authentication.getName());
        return ResponseEntity.ok(traitement);
    }

    @PutMapping("/reclamations/{id}/fermer")
    public ResponseEntity<Reclamation> fermerTicket(
            @PathVariable Long id,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Reclamation traitement = reclamationService.traiterReclamation(
                id, "CLOTURE", "Ticket clôturé par le Manager",
                null, null, authentication.getName());
        return ResponseEntity.ok(rec);
    }

    @PostMapping("/reclamations/{id}/commentaires")
    public ResponseEntity<Commentaire> ajouterCommentaire(
            @PathVariable Long id,
            @Valid @RequestBody CommentaireRequest request,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Commentaire commentaire = new Commentaire();
        commentaire.setContenu(request.getContenu());
        commentaire.setDateAction(new Date());
        commentaire.setAuteur(authentication.getName());
        commentaire.setReclamation(rec);

        commentaireRepository.save(commentaire);
        return ResponseEntity.status(HttpStatus.CREATED).body(commentaire);
    }

    @PostMapping("/escalades")
    public ResponseEntity<Escalade> creerEscalade(
            @Valid @RequestBody EscaladeRequest request,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Manager manager = managerRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Manager non trouvé"));

        Reclamation rec = reclamationRepository.findById(request.getReclamationId())
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Escalade escalade = new Escalade();
        escalade.setNiveau(request.getNiveau());
        escalade.setStatut("EN_ATTENTE");
        escalade.setMotif(request.getMotif());
        escalade.setDateEscalade(new Date());
        escalade.setReclamation(rec);
        escalade.setManager(manager);
        escaladeRepository.save(escalade);

        reclamationService.traiterReclamation(
                request.getReclamationId(),
                "ESCALADE_" + request.getNiveau(),
                "Escalade créée par le Manager: " + manager.getNom() + ". Motif: " + request.getMotif(),
                null, null, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED).body(escalade);
    }

    @GetMapping("/escalades")
    public ResponseEntity<Page<Escalade>> getEscalades(
            @RequestParam(required = false) String statut,
            Authentication authentication, Pageable pageable) {
        Manager manager = managerRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Manager non trouvé"));

        Page<Escalade> result;
        if (statut != null && !statut.isEmpty()) {
            result = escaladeRepository.findByStatut(statut, pageable);
        } else {
            result = escaladeRepository.findByManager_Id(manager.getId(), pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/escalades/enrichies")
    public ResponseEntity<List<Map<String, Object>>> getEscaladesEnrichies(
            @RequestParam(required = false) String statut,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        List<Escalade> escalades;
        if (statut != null && !statut.isEmpty()) {
            escalades = escaladeRepository.findByStatut(statut);
        } else {
            escalades = escaladeRepository.findAll();
        }
        if (agence != null) {
            escalades = escalades.stream()
                    .filter(e -> e.getReclamation() != null && e.getReclamation().getAgence() != null
                            && e.getReclamation().getAgence().getId().equals(agence.getId()))
                    .toList();
        }

        List<Map<String, Object>> result = escalades.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("niveau", e.getNiveau());
            m.put("statut", e.getStatut());
            m.put("dateEscalade", e.getDateEscalade());
            m.put("motif", e.getMotif());
            m.put("agent", e.getAgent() != null ? e.getAgent().getNom() : null);
            Reclamation rec = e.getReclamation();
            m.put("reclamationId", rec != null ? rec.getId() : null);
            m.put("reclamationReference", rec != null ? rec.getReference() : null);
            m.put("reclamationDomaine", rec != null ? rec.getDomaine() : null);
            m.put("reclamationStatut", rec != null ? rec.getStatut() : null);
            m.put("reclamationDescription", rec != null ? rec.getDescription() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/escalades/{id}/valider")
    public ResponseEntity<Escalade> validerEscalade(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ValidationEscaladeRequest request,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Manager manager = managerRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Manager non trouvé"));

        Escalade escalade = escaladeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Escalade introuvable"));
        verifierAppartenanceAgence(escalade.getReclamation(), authentication, agenceIdHeader);

        if (!"DEMANDE".equals(escalade.getStatut())) {
            throw new RuntimeException("Seules les demandes d'escalade en attente peuvent être validées");
        }

        Reclamation rec = escalade.getReclamation();
        EquipeSupport equipeN2 = null;
        if (request != null && request.getEquipeSupportId() != null) {
            equipeN2 = equipeSupportRepository.findById(request.getEquipeSupportId()).orElse(null);
        }
        if (equipeN2 == null) {
            equipeN2 = equipeSupportRepository
                    .findByNiveauAndDomaine("N2", rec.getDomaine() != null ? rec.getDomaine() : "MOBILE_MONEY")
                    .orElse(null);
        }
        if (equipeN2 != null) {
            rec.setEquipeSupport(equipeN2);
        }

        if (request != null && request.getAgentEmail() != null && !request.getAgentEmail().isEmpty()) {
            Agent agentN2 = agentRepository.findByEmail(request.getAgentEmail()).orElse(null);
            if (agentN2 != null) {
                reclamationService.verifierCompetenceDomaine(rec, agentN2);
                rec.setAgent(agentN2);
            }
        }

        escalade.setStatut("VALIDEE");
        escalade.setManager(manager);
        escaladeRepository.save(escalade);

        reclamationService.traiterReclamation(
                rec.getId(), "ESCALADE_N2",
                "Escalade N2 validée par le Manager: " + manager.getNom()
                        + (equipeN2 != null ? " - affectée à l'équipe " + equipeN2.getNom() : ""),
                null, null, authentication.getName());

        notificationService.notifierValidation(rec, "validée et affectée à l'équipe niveau 2", null);

        return ResponseEntity.ok(escalade);
    }

    @PutMapping("/escalades/{id}/rejeter")
    public ResponseEntity<Escalade> rejeterEscalade(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Escalade escalade = escaladeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Escalade introuvable"));
        verifierAppartenanceAgence(escalade.getReclamation(), authentication, agenceIdHeader);

        if (!"DEMANDE".equals(escalade.getStatut())) {
            throw new RuntimeException("Seules les demandes d'escalade en attente peuvent être rejetées");
        }

        escalade.setStatut("REJETEE");
        escaladeRepository.save(escalade);

        Reclamation rec = escalade.getReclamation();
        reclamationService.traiterReclamation(
                rec.getId(), "EN_COURS",
                "Demande d'escalade rejetée par le Manager"
                        + (body != null && body.get("motif") != null ? " : " + body.get("motif") : ""),
                null, null, authentication.getName());

        notificationService.notifierValidation(rec, "rejetée", null);

        return ResponseEntity.ok(escalade);
    }

    @PutMapping("/reclamations/{id}/valider")
    public ResponseEntity<Reclamation> validerResolution(
            @PathVariable Long id,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Reclamation traitement = reclamationService.traiterReclamation(
                id, "RESOLU", "Résolution validée par le Manager",
                null, null, authentication.getName());
        return ResponseEntity.ok(traitement);
    }

    @GetMapping("/agents")
    public ResponseEntity<List<Map<String, Object>>> listerAgents(
            @RequestParam(required = false) String domaine,
            @RequestParam(required = false) String niveau,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        List<Agent> agents;
        if (agence != null) {
            agents = agentRepository.findByAgence(agence);
            if (domaine != null && !domaine.isEmpty()) {
                String niv = niveau != null && !niveau.isEmpty() ? niveau : "N1";
                String d = domaine;
                String finalNiv = niv;
                agents = agents.stream()
                        .filter(a -> a.getEquipeSupport() != null && d.equals(a.getEquipeSupport().getDomaine()) && finalNiv.equals(a.getEquipeSupport().getNiveau()))
                        .toList();
            } else if (niveau != null && !niveau.isEmpty()) {
                String niv = niveau;
                agents = agents.stream()
                        .filter(a -> a.getEquipeSupport() != null && niv.equals(a.getEquipeSupport().getNiveau()))
                        .toList();
            }
        } else if (domaine != null && !domaine.isEmpty()) {
            String niv = niveau != null && !niveau.isEmpty() ? niveau : "N1";
            agents = agentRepository.findByRoleAndEquipeSupport_NiveauAndEquipeSupport_Domaine("ROLE_CHARGE_RECLAMATION", niv, domaine);
        } else if (niveau != null && !niveau.isEmpty()) {
            agents = agentRepository.findByRoleAndEquipeSupport_Niveau("ROLE_CHARGE_RECLAMATION", niveau);
        } else {
            agents = agentRepository.findAll();
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
            m.put("niveau", a.getEquipeSupport() != null ? a.getEquipeSupport().getNiveau() : null);
            m.put("domaine", a.getEquipeSupport() != null ? a.getEquipeSupport().getDomaine() : null);
            m.put("equipe", a.getEquipeSupport() != null ? a.getEquipeSupport().getNom() : null);
            m.put("nbTickets", mapComptage.getOrDefault(a.getNom(), 0L));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/equipes")
    public ResponseEntity<List<EquipeSupport>> listerEquipes(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            List<Agent> agentsAgence = agentRepository.findByAgence(agence);
            return ResponseEntity.ok(equipeSupportRepository.findAll().stream()
                    .filter(eq -> agentsAgence.stream().anyMatch(a -> a.getEquipeSupport() != null && a.getEquipeSupport().getId().equals(eq.getId())))
                    .toList());
        }
        return ResponseEntity.ok(equipeSupportRepository.findAll());
    }

    /** Chefs SISAV disponibles (pour l'affectation par le chef d'agence). */
    @GetMapping("/chefs-sisav")
    public ResponseEntity<List<Manager>> listerChefsSisav(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        List<Manager> chefs = managerRepository.findByRole("ROLE_CHEF_SAV");
        if (agence != null) {
            chefs = chefs.stream()
                    .filter(m -> m.getAgence() != null && m.getAgence().getId().equals(agence.getId()))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(chefs);
    }

    /** Agents support SAV (N1/N2) disponibles pour le chef SISAV. */
    @GetMapping("/agents-sav")
    public ResponseEntity<List<Agent>> listerAgentsSav(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        List<Agent> agents = agentRepository.findAll().stream()
                .filter(a -> a.getEquipeSupport() != null)
                .collect(Collectors.toList());
        if (agence != null) {
            agents = agents.stream()
                    .filter(a -> (a.getAgence() != null && a.getAgence().getId().equals(agence.getId()))
                            || (a.getAgence() == null))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(agents);
    }

    /** Le chef d'agence transmet une réclamation au SISAV (chef SISAV). */
    @PutMapping("/reclamations/{id}/affecter-sisav")
    public ResponseEntity<Reclamation> affecterSisav(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        String chefSisavEmail = body != null ? body.get("chefSisavEmail") : null;
        if (chefSisavEmail == null || chefSisavEmail.isBlank()) {
            throw new IllegalArgumentException("Le chef SISAV destinataire est obligatoire.");
        }

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        Manager chefSisav = managerRepository.findByEmail(chefSisavEmail)
                .orElseThrow(() -> new RuntimeException("Chef SISAV introuvable"));
        rec.setChefSisav(chefSisav);

        Reclamation traitement = reclamationService.traiterReclamation(
                id, "ASSIGNE_SISAV",
                "Réclamation transmise au SISAV par " + authentication.getName()
                        + " (chef SISAV: " + chefSisav.getNom() + ")",
                null, null, authentication.getName());
        notificationService.envoyerNotification("SISAV", 
                "Réclamation " + traitement.getReference() + " transmise au SISAV.",
                chefSisav.getEmail(), traitement.getId(), null);
        return ResponseEntity.ok(traitement);
    }

    /** Le chef SISAV affecte la réclamation à un agent support SAV, avec avis/commentaires. */
    @PutMapping("/reclamations/{id}/affecter-agent-sav")
    public ResponseEntity<Reclamation> affecterAgentSav(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        String agentEmail = body != null ? body.get("agentEmail") : null;
        String avis = body != null ? body.get("avis") : null;
        if (agentEmail == null || agentEmail.isBlank()) {
            throw new IllegalArgumentException("L'agent support SAV destinataire est obligatoire.");
        }

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        if (!"ASSIGNE_SISAV".equals(rec.getStatut())) {
            throw new IllegalArgumentException(
                    "Seule une réclamation transmise au SISAV (ASSIGNE_SISAV) peut être affectée à un agent SAV.");
        }

        Agent agent = agentRepository.findByEmail(agentEmail)
                .orElseThrow(() -> new RuntimeException("Agent SAV introuvable"));

        String commentaire = "Réclamation affectée par le chef SISAV " + authentication.getName()
                + " à l'agent SAV " + agent.getNom()
                + (avis != null && !avis.isBlank() ? ". Avis du chef SISAV: " + avis : "");

        Reclamation traitement = reclamationService.traiterReclamation(
                id, "ASSIGNE", commentaire, null, agentEmail, authentication.getName());
        notificationService.envoyerNotification("AFFECTATION_SAV",
                "Réclamation " + traitement.getReference() + " affectée à un agent SAV.",
                agent.getEmail(), traitement.getId(), null);
        return ResponseEntity.ok(traitement);
    }

    /** Transfert d'une réclamation d'une agence X vers une agence Y (gestionnaire global uniquement).
     *  Le dossier change de rattachement (agence_id), disparaît de la vue de l'agence X et
     *  apparaît dans celle de l'agence Y, avec traçabilité dans l'historique. */
    @PutMapping("/reclamations/{id}/transferer-agence")
    public ResponseEntity<Reclamation> transfererAgence(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        String role = authentication.getAuthorities().stream()
                .findFirst().map(a -> a.getAuthority()).orElse("");
        if (!"ROLE_CHEF_AGENCE".equals(role) && !"ROLE_GESTIONNAIRE".equals(role) && !"ROLE_ADMIN".equals(role)) {
            throw new SecurityException("Seul le gestionnaire (vue globale) peut transférer un dossier entre agences.");
        }

        String agenceIdStr = body != null ? body.get("agenceId") : null;
        if (agenceIdStr == null || agenceIdStr.isBlank()) {
            throw new IllegalArgumentException("L'agence de destination est obligatoire.");
        }
        Long agenceId = Long.parseLong(agenceIdStr);
        Agence agenceDest = agenceRepository.findById(agenceId)
                .orElseThrow(() -> new RuntimeException("Agence de destination introuvable"));

        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        Agence agenceOrigine = rec.getAgence();
        rec.setAgence(agenceDest);

        String details = "Transfert inter-agences par " + authentication.getName()
                + " : " + (agenceOrigine != null ? agenceOrigine.getNom() : "aucune")
                + " -> " + agenceDest.getNom();
        HistoriqueTicket audit = new HistoriqueTicket();
        audit.setDateAction(new Date());
        audit.setAction("TRANSFERT_AGENCE");
        audit.setAncienStatut(rec.getStatut());
        audit.setNouveauStatut(rec.getStatut());
        audit.setActeur(authentication.getName());
        audit.setDetails(details);
        audit.setReclamation(rec);
        historiqueTicketRepository.save(audit);

        Commentaire commentaire = new Commentaire();
        commentaire.setContenu(details);
        commentaire.setDateAction(new Date());
        commentaire.setAuteur(authentication.getName());
        commentaire.setReclamation(rec);
        commentaireRepository.save(commentaire);

        reclamationRepository.save(rec);
        return ResponseEntity.ok(rec);
    }

    /** Statistiques consolidées par agence (réservé au gestionnaire). */
    @GetMapping("/stats-par-agence")
    public ResponseEntity<List<Map<String, Object>>> statsParAgence(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        String role = authentication.getAuthorities().stream()
                .findFirst().map(a -> a.getAuthority()).orElse("");
        List<Reclamation> toutes;

        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            toutes = reclamationRepository.findByAgence_Id(agence.getId());
        } else if ("ROLE_CHEF_SAV".equals(role)) {
            Manager chefSav = managerRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Chef SAV non trouvé"));
            Agence agenceChef = chefSav.getAgence();
            toutes = (agenceChef != null)
                    ? reclamationRepository.findByAgence_IdAndSisav(agenceChef.getId(), chefSav.getEmail())
                    : reclamationRepository.findBySisav(chefSav.getEmail());
        } else {
            toutes = reclamationRepository.findAll();
        }
        Map<String, Long> comptages = toutes.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getAgence() != null ? r.getAgence().getNom() : "Sans agence",
                        Collectors.counting()));

        List<Map<String, Object>> result = comptages.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("agence", e.getKey());
            m.put("total", e.getValue());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
