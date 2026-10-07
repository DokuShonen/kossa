package com.kossa.service;

import com.kossa.entity.*;
import com.kossa.enums.StatutReclamation;
import com.kossa.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class ReclamationService {

    private static final Logger log = LoggerFactory.getLogger(ReclamationService.class);

    @Autowired private ReclamationRepository reclamationRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private TypeReclamationRepository typeReclamationRepository;
    @Autowired private CategorieRepository categorieRepository;
    @Autowired private AgentRepository agentRepository;
    @Autowired private EquipeSupportRepository equipeSupportRepository;
    @Autowired private NotificationService notificationService;

    public static final List<String> PREFIXES_KOSSA = List.of(
            "01","02","03","60","61","62","63",
            "70","71","72","73");

    public static String determinerDomaine(String type) {
        if (type == null) return "MOBILE_MONEY";
        switch (type) {
            case "Mobile Money": return "MOBILE_MONEY";
            case "FTTH": return "FTTH";
            case "Internet": return "INTERNET";
            case "Facturation": return "FACTURATION";
            case "Technique": return "TECHNIQUE";
            default: return "MOBILE_MONEY";
        }
    }

    /** SLA par type de réclamation (heures), cohérent avec l'affichage métier en agence. */
    public static int determinerSlaHeures(String type) {
        if (type == null) return 24;
        switch (type) {
            case "Mobile Money": return 12;
            case "Facturation": return 48;
            case "FTTH":
            case "Internet":
            case "Technique":
            default: return 24;
        }
    }

    public static void validerMsisdn(String msisdn) {
        if (msisdn == null || msisdn.isBlank()) {
            throw new IllegalArgumentException("Le numéro MSISDN est obligatoire");
        }
        String clean = msisdn.trim();
        if (clean.startsWith("+226")) clean = clean.substring(4);
        else if (clean.startsWith("00226")) clean = clean.substring(5);
        else if (clean.startsWith("226")) clean = clean.substring(3);
        if (!clean.matches("[0-9]{8}")) {
            throw new IllegalArgumentException("Le MSISDN doit contenir l'indicatif +226 suivi de 8 chiffres");
        }
        String prefixe = clean.substring(0, 2);
        if (!PREFIXES_KOSSA.contains(prefixe)) {
            throw new IllegalArgumentException("Numéro non reconnu comme un numéro KOSSA (préfixe " + prefixe + " non autorisé)");
        }
    }

    @Transactional(readOnly = true)
    public Reclamation recupererReclamationParId(Long id) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable avec l'id : " + id));
        
        if (rec.getCommentaires() != null) {
            rec.getCommentaires().size(); 
        }
        if (rec.getPiecesJointes() != null) {
            rec.getPiecesJointes().size();
        }
        return rec;
    }

    public List<Reclamation> recupererToutesLesReclamations() {
        return reclamationRepository.findAll();
    }

    public List<Reclamation> recupererTicketsParStatut(String statut) {
        return reclamationRepository.findByStatut(statut);
    }

    public List<Reclamation> findAll(Long clientId) {
        if (clientId != null) {
            return reclamationRepository.findByClient_Id(clientId);
        }
        return reclamationRepository.findAll();
    }

    @Transactional
    public Reclamation creerReclamationAvecSla(String msisdn, String nom, String prenom, 
                                               String description, String nomType, 
                                               String priorite, String canalNom, String agentEmail) {
        log.info("Création réclamation - msisdn: {}, type: {}, canal: {}", msisdn, nomType, canalNom);

        validerPriorite(priorite);

        Client client = clientRepository.findByMsisdn(msisdn)
                .orElseGet(() -> {
                    Client c = new Client();
                    c.setMsisdn(msisdn);
                    c.setNom(nom);
                    c.setPrenom(prenom);
                    return clientRepository.save(c);
                });

        validerMsisdn(msisdn);

        TypeReclamation typeRec = typeReclamationRepository.findByNomType(nomType)
                .orElseThrow(() -> new RuntimeException("Type introuvable : " + nomType));

        Reclamation rec = new Reclamation();
        rec.setClient(client);
        rec.setObjet(nomType);
        rec.setCanalNom(canalNom);
        rec.setType(nomType);
        rec.setDescription(description);
        rec.setTypeReclamation(typeRec);
        rec.setPriorite(priorite);
        rec.setStatut("OUVERT");
        rec.setDomaine(determinerDomaine(nomType));
        rec.setDateCreation(new Date());
        rec.setReference("KOSSA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        // Rattachement de la catégorie correspondant à la priorité pour disposer du SLA paramétré
        if (priorite != null) {
            categorieRepository.findByNom(priorite).ifPresent(rec::setCategorie);
        }

        EquipeSupport equipeN1 = equipeSupportRepository
                .findByNiveauAndDomaine("N1", rec.getDomaine())
                .orElse(null);
        rec.setEquipeSupport(equipeN1);

        // SLA réel appliqué : d'abord le SLA du type affiché en agence, sinon SLA de la catégorie paramétrée
        int heuresSla = determinerSlaHeures(nomType);
        if (heuresSla <= 0 && rec.getCategorie() != null && rec.getCategorie().getSla() != null) {
            heuresSla = rec.getCategorie().getSla().getTempsMaximumHeures();
        }
        Calendar cal = Calendar.getInstance();
        cal.setTime(rec.getDateCreation());
        cal.add(Calendar.HOUR, heuresSla);
        rec.setDateEcheance(cal.getTime());
        
        Agent agent = agentRepository.findByEmail(agentEmail).orElse(null);
        rec.setAgent(agent);
        if (agent != null && agent.getAgence() != null) {
            rec.setAgence(agent.getAgence());
        }

        Commentaire c = new Commentaire();
        c.setContenu("Création de la réclamation via le canal: " + canalNom + ". Statut: [OUVERT].");
        c.setDateAction(new Date());
        c.setAuteur(agentEmail);
        c.setReclamation(rec);
        rec.setCommentaires(new ArrayList<>(List.of(c)));

        Reclamation saved = reclamationRepository.save(rec);
        notificationService.notifierClientCreation(saved, null);
        log.info("Réclamation créée: {}", saved.getReference());
        return saved;
    }

    @Transactional
    public Reclamation traiterReclamation(Long id, String nouveauStatut, String commentaire, 
                                          String planActionDesc, String affecteAEmail, String auteurAction) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        if (nouveauStatut == null || nouveauStatut.isBlank()) {
            throw new IllegalArgumentException("Le statut est obligatoire");
        }
        if (!StatutReclamation.estValide(nouveauStatut)) {
            throw new IllegalArgumentException("Statut inconnu : " + nouveauStatut
                    + " (statuts autorisés : OUVERT, ASSIGNE, EN_TRAITEMENT, EN_COURS, RESOLU, CLOTURE, ESCALADE_N1, ESCALADE_N2)");
        }

        String ancienStatut = rec.getStatut();
        validerTransitionStatut(ancienStatut, nouveauStatut);
        rec.setStatut(nouveauStatut);

        if (rec.getCommentaires() == null) {
            rec.setCommentaires(new ArrayList<>());
        }

        // Gestion de l'affectation manuelle (réservée au manager)
        if (affecteAEmail != null && !affecteAEmail.isEmpty()) {
            Agent nouvelAgent = agentRepository.findByEmail(affecteAEmail).orElse(null);
            if (nouvelAgent != null) {
                verifierCompetenceDomaine(rec, nouvelAgent);
                rec.setAgent(nouvelAgent);
                if (nouvelAgent.getEquipeSupport() != null) {
                    rec.setEquipeSupport(nouvelAgent.getEquipeSupport());
                }
                Commentaire aff = new Commentaire();
                aff.setContenu("Ticket affecté manuellement à l'agent : " + nouvelAgent.getNom() + " (équipe " 
                        + (nouvelAgent.getEquipeSupport() != null ? nouvelAgent.getEquipeSupport().getNom() : "non définie") + ")");
                aff.setDateAction(new Date());
                aff.setAuteur(auteurAction);
                aff.setReclamation(rec);
                rec.getCommentaires().add(aff);
            }
        }

        // Intégration d'un plan d'actions si présent
        if (planActionDesc != null && !planActionDesc.isEmpty()) {
            PlanAction plan = rec.getPlanAction();
            if (plan == null) {
                plan = new PlanAction();
                plan.setReclamation(rec);
            }
            plan.setDescription(planActionDesc);
            plan.setDateExecution(new Date());
            rec.setPlanAction(plan);
        }

        // Historisation systématique
        Commentaire log = new Commentaire();
        log.setContenu("Changement de statut de [" + ancienStatut + "] à [" + nouveauStatut + "]. Commentaire: " + commentaire);
        log.setDateAction(new Date());
        log.setAuteur(auteurAction);
        log.setReclamation(rec);
        rec.getCommentaires().add(log);

        Reclamation saved = reclamationRepository.save(rec);
        notificationService.notifierClientChangementStatut(saved, ancienStatut, null);
        return saved;
    }

    @Transactional
    public Reclamation mettreAJourStatut(Long reclamationId, String nouveauStatut, String nomAuteurAction) {
        return traiterReclamation(reclamationId, nouveauStatut, "Mise à jour via interface", null, null, nomAuteurAction);
    }

    public static void validerPriorite(String priorite) {
        if (priorite == null || priorite.isBlank()) {
            throw new IllegalArgumentException("La priorité est obligatoire");
        }
        if (!List.of("FAIBLE", "MOYENNE", "CRITIQUE").contains(priorite.trim())) {
            throw new IllegalArgumentException(
                    "Priorité invalide : " + priorite + " (valeurs acceptées : FAIBLE, MOYENNE, CRITIQUE)");
        }
    }

    /** Retourne la liste des statuts légalement atteignables depuis le statut courant,
     *  en appliquant les mêmes règles de transition que traiterReclamation(). */
    public List<String> statutsSuivants(String statut) {
        List<String> candidats = List.of(
                "EN_TRAITEMENT", "EN_COURS", "ASSIGNE_SISAV", "REGULARISEE",
                "RESOLU", "CLOTURE", "REOUVERT",
                "ESCALADE_N1", "ESCALADE_N2", "EN_ATTENTE_SUPERVISEUR");
        return candidats.stream()
                .filter(c -> !c.equalsIgnoreCase(statut))
                .filter(c -> transitionAutorisee(statut, c))
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean transitionAutorisee(String ancien, String nouveau) {
        try {
            validerTransitionStatut(ancien, nouveau);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    @Transactional
    public Reclamation mettreAJourReclamation(Long id, String description, String priorite, String canalNom) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        if (description != null && !description.isEmpty()) rec.setDescription(description);
        if (priorite != null && !priorite.isEmpty()) {
            validerPriorite(priorite);
            rec.setPriorite(priorite.trim());
        }
        if (canalNom != null && !canalNom.isEmpty()) rec.setCanalNom(canalNom);

        Commentaire c = new Commentaire();
        c.setContenu("Réclamation modifiée par l'agent");
        c.setDateAction(new Date());
        c.setAuteur("SYSTEME");
        c.setReclamation(rec);
        if (rec.getCommentaires() == null) rec.setCommentaires(new ArrayList<>());
        rec.getCommentaires().add(c);

        return reclamationRepository.save(rec);
    }

    @Transactional
    public void supprimerReclamation(Long id) {
        Reclamation rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable : " + id));
        reclamationRepository.delete(rec);
    }

    @Transactional
    public void supprimerReclamations(List<Long> ids) {
        List<Reclamation> list = reclamationRepository.findAllById(ids);
        reclamationRepository.deleteAll(list);
    }

    public List<Reclamation> rechercherParMotCle(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return reclamationRepository.findAll();
        }
        return reclamationRepository.rechercherParMotCle(keyword.trim());
    }

    public void verifierCompetenceDomaine(Reclamation rec, Agent agent) {
        String domaineReclamation = rec.getDomaine() != null ? rec.getDomaine() : "MOBILE_MONEY";
        String domaineAgent = agent.getEquipeSupport() != null && agent.getEquipeSupport().getDomaine() != null
                ? agent.getEquipeSupport().getDomaine() : "MOBILE_MONEY";
        if (!domaineReclamation.equals(domaineAgent)) {
            throw new IllegalArgumentException(
                    "Affectation refusée : la réclamation relève du domaine " + domaineReclamation
                    + " mais l'agent appartient à l'équipe " + domaineAgent
                    + ". Une réclamation " + domaineReclamation + " ne peut être affectée qu'à une équipe " + domaineReclamation + "."
            );
        }
    }

    // Validation des transitions légales entre statuts métier
    private void validerTransitionStatut(String ancien, String nouveau) {
        if (ancien == null) return;

        // Réouverture d'un ticket clôturé (dossier déjà traité)
        if ("REOUVERT".equalsIgnoreCase(nouveau)) {
            if (StatutReclamation.estFermeture(ancien) || "RESOLU".equalsIgnoreCase(ancien)) {
                return;
            }
            throw new IllegalArgumentException(
                    "Transition invalide : seul un ticket résolu ou clôturé peut être réouvert (REOUVERT).");
        }

        if (StatutReclamation.estFermeture(ancien)) {
            throw new IllegalArgumentException(
                    "Le ticket est déjà clôturé [" + ancien + "]. Aucune transition n'est possible.");
        }
        if (ancien.equalsIgnoreCase(nouveau)) {
            return;
        }
        if (StatutReclamation.estFermeture(nouveau)) {
            return;
        }
        // Régularisation immédiate en agence (N1) : à tout moment avant clôture
        if ("REGULARISEE".equalsIgnoreCase(nouveau)
                && StatutReclamation.estOuvertOuTraitement(ancien)) {
            return;
        }
        // Demande / retrait d'une validation superviseur (dérogation, remboursement, geste commercial)
        if ("EN_ATTENTE_SUPERVISEUR".equalsIgnoreCase(nouveau)
                && StatutReclamation.estOuvertOuTraitement(ancien)) {
            return;
        }
        if ("VALIDATION_SUPERVISEUR".equalsIgnoreCase(ancien)
                && ("RESOLU".equalsIgnoreCase(nouveau) || "CLOTURE".equalsIgnoreCase(nouveau)
                    || "EN_COURS".equalsIgnoreCase(nouveau) || "REJETEE".equalsIgnoreCase(nouveau))) {
            return;
        }
        // Escalade N1 ou N2 : possible depuis tout statut ouvert / en traitement
        if ("ESCALADE_N1".equalsIgnoreCase(nouveau) || "ESCALADE_N2".equalsIgnoreCase(nouveau)) {
            if (StatutReclamation.estOuvertOuTraitement(ancien)
                    || "EN_ATTENTE_SUPERVISEUR".equalsIgnoreCase(ancien)
                    || "ESCALADE_N1".equalsIgnoreCase(ancien)) {
                return;
            }
            throw new IllegalArgumentException(
                    "Transition invalide : escalade impossible depuis [" + ancien + "].");
        }
        if ("ASSIGNE_SISAV".equalsIgnoreCase(nouveau)) {
            if (StatutReclamation.estOuvertOuTraitement(ancien) || "OUVERT".equals(ancien)) {
                return;
            }
            throw new IllegalArgumentException(
                    "Transition invalide : une réclamation ne peut être transmise au SISAV que depuis un statut ouvert ou en traitement.");
        }
        if ("ASSIGNE_SISAV".equalsIgnoreCase(ancien)) {
            if ("ASSIGNE".equals(nouveau) || "EN_TRAITEMENT".equals(nouveau)
                    || "EN_COURS".equals(nouveau) || "REGULARISEE".equals(nouveau)) {
                return;
            }
            throw new IllegalArgumentException(
                    "Transition invalide : une réclamation transmise au SISAV doit être affectée à un agent SAV (ASSIGNE) avant traitement.");
        }
        if ("OUVERT".equals(ancien) && !("ASSIGNE".equals(nouveau) || "EN_TRAITEMENT".equals(nouveau)
                || "EN_COURS".equals(nouveau) || "ASSIGNE_SISAV".equals(nouveau))) {
            throw new IllegalArgumentException(
                    "Transition invalide : de [" + ancien + "] à [" + nouveau
                    + "]. Un ticket ouvert doit d'abord être assigné (ASSIGNE) ou pris en traitement (EN_TRAITEMENT).");
        }
        if ("ASSIGNE".equals(ancien) && !("EN_TRAITEMENT".equals(nouveau) || "EN_COURS".equals(nouveau)
                || "RESOLU".equals(nouveau) || "ESCALADE_N1".equals(nouveau) || "CLOTURE".equals(nouveau))) {
            throw new IllegalArgumentException(
                    "Transition invalide : de [" + ancien + "] à [" + nouveau + "].");
        }
    }
}
