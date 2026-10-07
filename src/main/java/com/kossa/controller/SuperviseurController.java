package com.kossa.controller;

import com.kossa.entity.*;
import com.kossa.repository.*;
import com.kossa.service.NotificationService;
import com.kossa.service.ReclamationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/superviseur")
@PreAuthorize("hasRole('SUPERVISEUR')")
public class SuperviseurController {

    @Autowired private SuperviseurRepository superviseurRepository;
    @Autowired private AgentRepository agentRepository;
    @Autowired private ManagerRepository managerRepository;
    @Autowired private EquipeSupportRepository equipeSupportRepository;
    @Autowired private EscaladeRepository escaladeRepository;
    @Autowired private ReclamationRepository reclamationRepository;
    @Autowired private ReclamationService reclamationService;
    @Autowired private NotificationService notificationService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private AgenceRepository agenceRepository;

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

    /**
     * Vue de supervision : activité des agents, des managers et des équipes
     * de résolution, le tout scopé sur l'équipe du superviseur (par domaine).
     */
    @GetMapping("/activite")
    public ResponseEntity<Map<String, Object>> voirActivite(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader,
            @RequestParam(value = "domaine", required = false) String domaineParam) {
        Superviseur superviseur = superviseurRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));

        String domaineDefaut = superviseur.getEquipeSupervisee() != null
                ? superviseur.getEquipeSupervisee().getDomaine() : "MOBILE_MONEY";
        String domaine = (domaineParam != null && !domaineParam.isBlank()) ? domaineParam : domaineDefaut;

        List<Reclamation> recsDuDomaine = reclamationsDuPerimetre(domaine, agenceIdHeader, authentication);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("superviseur", superviseur);
        result.put("domaine", domaine);
        result.put("supervisionGenerale", estSupervisionGenerale(domaine));
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        result.put("agence", agence != null ? agence.getNom() : null);
        result.put("domaines", java.util.Arrays.stream(com.kossa.enums.Domaine.values()).map(Enum::name).collect(Collectors.toList()));

        // Équipes de résolution du périmètre (N1 + N2)
        List<EquipeSupport> equipes = equipesDuPerimetre(domaine, agenceIdHeader, authentication);
        result.put("equipes", equipes.stream().map(e -> {
            List<Reclamation> recsEquipe = reclamationRepository.findByEquipeSupportId(e.getId()).stream()
                    .filter(r -> agence == null || (r.getAgence() != null && r.getAgence().getId().equals(agence.getId())))
                    .collect(Collectors.toList());
            Map<String, Object> eq = new LinkedHashMap<>();
            eq.put("id", e.getId());
            eq.put("nom", e.getNom());
            eq.put("niveau", e.getNiveau());
            eq.put("domaine", e.getDomaine());
            eq.put("resolues", recsEquipe.stream().filter(r -> estCloturee(r.getStatut())).count());
            eq.put("enCours", recsEquipe.stream().filter(r -> !estCloturee(r.getStatut())).count());
            eq.put("total", recsEquipe.size());
            return eq;
        }).collect(Collectors.toList()));

        // Agents collecteurs du périmètre : avec nombre de réclamations recueillies
        List<Agent> agents = agentsDuPerimetre(domaine, agenceIdHeader, authentication);
        result.put("agents", agents.stream().map(a -> {
            List<Reclamation> recsAgent = reclamationRepository.findByAgentEmail(a.getEmail()).stream()
                    .filter(r -> agence == null || (r.getAgence() != null && r.getAgence().getId().equals(agence.getId())))
                    .collect(Collectors.toList());
            Map<String, Object> ag = new LinkedHashMap<>();
            ag.put("id", a.getId());
            ag.put("nom", a.getNom());
            ag.put("email", a.getEmail());
            ag.put("matricule", a.getMatricule());
            ag.put("equipe", a.getEquipeSupport() != null ? a.getEquipeSupport().getNom() : null);
            ag.put("nbReclamations", recsAgent.size());
            ag.put("resolues", recsAgent.stream().filter(r -> estCloturee(r.getStatut())).count());
            return ag;
        }).collect(Collectors.toList()));

        // Managers : avec le nombre d'escalades N2 traitées
        result.put("managers", managerRepository.findByRole("ROLE_CHEF_AGENCE").stream()
                .filter(m -> agence == null || (m.getAgence() != null && m.getAgence().getId().equals(agence.getId())))
                .map(m -> {
            long nbEscalades = escaladeRepository.findByNiveau("N2").stream()
                    .filter(esc -> esc.getManager() != null && esc.getManager().getEmail().equals(m.getEmail()))
                    .count();
            Map<String, Object> mg = new LinkedHashMap<>();
            mg.put("id", m.getId());
            mg.put("nom", m.getNom());
            mg.put("email", m.getEmail());
            mg.put("departement", m.getDepartement());
            mg.put("nbEscalades", nbEscalades);
            return mg;
        }).collect(Collectors.toList()));

        result.put("stats", calculerIndicateurs(recsDuDomaine));
        return ResponseEntity.ok(result);
    }

    private String domaineDuSuperviseur(Authentication authentication) {
        Superviseur superviseur = superviseurRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));
        return superviseur.getEquipeSupervisee() != null
                ? superviseur.getEquipeSupervisee().getDomaine() : "MOBILE_MONEY";
    }

    /** Vrai si le superviseur supervise tous les domaines (équipe générale / central). */
    private boolean estSupervisionGenerale(String domaine) {
        return false;
    }

    /** Réclamations du périmètre du superviseur : toutes si supervision centrale. */
    private List<Reclamation> reclamationsDuPerimetre(String domaine, Long agenceId, Authentication auth) {
        Agence agence = agenceSelectionnee(auth, agenceId);
        if (agence != null) {
            if (estSupervisionGenerale(domaine)) {
                return reclamationRepository.findByAgence_Id(agence.getId());
            }
            return reclamationRepository.findByAgence_IdAndEquipeSupportDomaine(agence.getId(), domaine);
        }
        if (estSupervisionGenerale(domaine)) {
            return reclamationRepository.findAll();
        }
        return reclamationRepository.findByEquipeSupportDomaine(domaine);
    }

    /** Équipes du périmètre : toutes si supervision centrale, sinon par domaine. Filtre par agence si local. */
    private List<EquipeSupport> equipesDuPerimetre(String domaine, Long agenceId, Authentication auth) {
        Agence agence = agenceSelectionnee(auth, agenceId);
        List<EquipeSupport> equipes = estSupervisionGenerale(domaine)
                ? equipeSupportRepository.findAll()
                : equipeSupportRepository.findByDomaine(domaine);
        if (agence != null) {
            Set<Long> equipesAvecAgents = agentRepository.findByEquipeSupport_Domaine(domaine).stream()
                    .filter(a -> a.getAgence() != null && a.getAgence().getId().equals(agence.getId()))
                    .map(a -> a.getEquipeSupport().getId())
                    .collect(Collectors.toSet());
            return equipes.stream()
                    .filter(e -> equipesAvecAgents.contains(e.getId()))
                    .collect(Collectors.toList());
        }
        return equipes;
    }

    /** Agents collecteurs du périmètre : tous si supervision centrale, sinon par domaine. Filtre par agence si local. */
    private List<Agent> agentsDuPerimetre(String domaine, Long agenceId, Authentication auth) {
        Agence agence = agenceSelectionnee(auth, agenceId);
        List<Agent> agents = agentRepository.findByEquipeSupport_Domaine(domaine);
        if (agence != null) {
            return agents.stream()
                    .filter(a -> a.getAgence() != null && a.getAgence().getId().equals(agence.getId()))
                    .collect(Collectors.toList());
        }
        return agents;
    }

    /** Demandes soumises au superviseur pour validation (dérogation, remboursement, geste commercial). */
    @GetMapping("/demandes-validation")
    public ResponseEntity<Map<String, Object>> demandesValidation(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader,
            @RequestParam(value = "domaine", required = false) String domaineParam) {
        String domaineDefaut = domaineDuSuperviseur(authentication);
        String domaine = (domaineParam != null && !domaineParam.isBlank()) ? domaineParam : domaineDefaut;
        List<Map<String, Object>> demandes = reclamationsDuPerimetre(domaine, agenceIdHeader, authentication).stream()
                .filter(r -> "EN_ATTENTE_SUPERVISEUR".equals(r.getStatut())
                        || "VALIDATION_SUPERVISEUR".equals(r.getStatut()))
                .map(this::toDetail)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("domaine", domaine, "count", demandes.size(), "demandes", demandes));
    }

    /** Valide une demande de dérogation / remboursement → ticket RESOLU (geste commercial accordé). */
    @PutMapping("/reclamations/{id}/valider-derogation")
    public ResponseEntity<Reclamation> validerDerogation(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        String motif = body != null ? body.getOrDefault("motif", "Dérogation validée par le Superviseur") : "Dérogation validée par le Superviseur";
        Reclamation traitement = reclamationService.traiterReclamation(
                id, "RESOLU", motif, null, null, authentication.getName());
        notificationService.notifierValidation(traitement, "dérogation accordée par le Superviseur", null);
        return ResponseEntity.ok(traitement);
    }

    /** Rejette une demande de dérogation → retour EN_COURS. */
    @PutMapping("/reclamations/{id}/rejeter-derogation")
    public ResponseEntity<Reclamation> rejeterDerogation(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        String motif = body != null ? body.getOrDefault("motif", "Dérogation rejetée par le Superviseur") : "Dérogation rejetée par le Superviseur";
        Reclamation traitement = reclamationService.traiterReclamation(
                id, "EN_COURS", motif, null, null, authentication.getName());
        notificationService.notifierValidation(traitement, "dérogation rejetée par le Superviseur", null);
        return ResponseEntity.ok(traitement);
    }

    /** Escalade immédiate vers l'équipe N2 du domaine. */
    @PostMapping("/reclamations/{id}/escalade-immediate")
    public ResponseEntity<Escalade> escaladeImmediate(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        verifierAppartenanceAgence(rec, authentication, agenceIdHeader);

        String motif = body != null && body.get("motif") != null
                ? body.get("motif") : "Escalade immédiate demandée par le Superviseur";

        Escalade escalade = new Escalade();
        escalade.setNiveau("N2");
        escalade.setStatut("EN_ATTENTE");
        escalade.setDateEscalade(new Date());
        escalade.setMotif(motif);
        escalade.setReclamation(rec);
        escaladeRepository.save(escalade);

        reclamationService.traiterReclamation(
                id, "ESCALADE_N2", "Escalade immédiate N2 par le Superviseur. Motif: " + motif,
                null, null, authentication.getName());
        notificationService.notifierEscalade(rec, "N2", null);
        return ResponseEntity.ok(escalade);
    }

    /** Réclamations détaillées d'un agent donné. Réservé à la supervision de son domaine. */
    @GetMapping("/agent/{id}/reclamations")
    public ResponseEntity<?> reclamationsAgent(@PathVariable Long id, Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Superviseur superviseur = superviseurRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent introuvable"));
        String domaineSup = superviseur.getEquipeSupervisee() != null
                ? superviseur.getEquipeSupervisee().getDomaine() : "MOBILE_MONEY";
        if (agent.getEquipeSupport() != null && !estSupervisionGenerale(domaineSup)
                && !domaineSup.equals(agent.getEquipeSupport().getDomaine())) {
            throw new RuntimeException("Agent hors du domaine supervisé");
        }
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        List<Reclamation> recs = reclamationRepository.findByAgent_Id(id).stream()
                .filter(r -> agence == null || (r.getAgence() != null && r.getAgence().getId().equals(agence.getId())))
                .collect(Collectors.toList());
        List<Map<String, Object>> detail = recs.stream().map(this::toDetail).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("agent", agent, "count", detail.size(), "reclamations", detail));
    }

    /** Réclamations détaillées d'une équipe de résolution. */
    @GetMapping("/equipe/{id}/reclamations")
    public ResponseEntity<?> reclamationsEquipe(@PathVariable Long id, Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Superviseur superviseur = superviseurRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));
        EquipeSupport equipe = equipeSupportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Équipe introuvable"));
        String domaineSup = superviseur.getEquipeSupervisee() != null
                ? superviseur.getEquipeSupervisee().getDomaine() : "MOBILE_MONEY";
        if (equipe.getDomaine() != null && !estSupervisionGenerale(domaineSup)
                && !domaineSup.equals(equipe.getDomaine())) {
            throw new RuntimeException("Équipe hors périmètre supervisé");
        }
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        List<Reclamation> recs = reclamationRepository.findByEquipeSupportId(id).stream()
                .filter(r -> agence == null || (r.getAgence() != null && r.getAgence().getId().equals(agence.getId())))
                .collect(Collectors.toList());
        List<Map<String, Object>> detail = recs.stream().map(this::toDetail).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("equipe", equipe, "count", detail.size(), "reclamations", detail));
    }

    private Map<String, Object> toDetail(Reclamation r) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("id", r.getId());
        d.put("reference", r.getReference());
        d.put("objet", r.getObjet());
        d.put("type", r.getType());
        d.put("statut", r.getStatut());
        d.put("priorite", r.getPriorite());
        d.put("dateCreation", r.getDateCreation());
        d.put("dateEcheance", r.getDateEcheance());
        d.put("client", r.getClient() != null ? r.getClient().getNom() + (r.getClient().getPrenom() != null ? " " + r.getClient().getPrenom() : "") + " (" + r.getClient().getMsisdn() + ")" : null);
        d.put("agent", r.getAgent() != null ? r.getAgent().getNom() : null);
        d.put("agence", r.getAgence() != null ? r.getAgence().getNom() : null);
        return d;
    }

    private boolean estCloturee(String statut) {
        return "RESOLU".equals(statut) || "CLOTURE".equals(statut);
    }

    private Map<String, Object> calculerIndicateurs(List<Reclamation> liste) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", liste.size());
        Map<String, Long> parStatut = liste.stream()
                .collect(Collectors.groupingBy(Reclamation::getStatut, Collectors.counting()));
        stats.put("parStatut", parStatut);
        Map<String, Long> parPriorite = liste.stream()
                .collect(Collectors.groupingBy(Reclamation::getPriorite, Collectors.counting()));
        stats.put("parPriorite", parPriorite);
        Map<String, Long> parAgent = liste.stream()
                .filter(r -> r.getAgent() != null)
                .collect(Collectors.groupingBy(r -> r.getAgent().getNom(), Collectors.counting()));
        stats.put("parAgent", parAgent);
        Map<String, Long> parEquipe = liste.stream()
                .filter(r -> r.getEquipeSupport() != null)
                .collect(Collectors.groupingBy(r -> r.getEquipeSupport().getNom(), Collectors.counting()));
        stats.put("parEquipe", parEquipe);
        return stats;
    }
}
