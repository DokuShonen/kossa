package com.kossa;

import com.kossa.entity.Agent;
import com.kossa.entity.Escalade;
import com.kossa.entity.EquipeSupport;
import com.kossa.entity.Reclamation;
import com.kossa.repository.AgentRepository;
import com.kossa.repository.EquipeSupportRepository;
import com.kossa.repository.EscaladeRepository;
import com.kossa.repository.ReclamationRepository;
import com.kossa.service.ReclamationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class WorkflowReclamationIntegrationTests {

    @Autowired private ReclamationService reclamationService;
    @Autowired private ReclamationRepository reclamationRepository;
    @Autowired private AgentRepository agentRepository;
    @Autowired private EquipeSupportRepository equipeSupportRepository;
    @Autowired private EscaladeRepository escaladeRepository;

    // ---------- POINT 3 : validation MSISDN ----------

    @Test
    void validerMsisdn_accepte_formatValide() {
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22670010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("70010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("0022670010203"));
    }

    @Test
    void validerMsisdn_refuse_prefixeNonKossa() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> reclamationService.validerMsisdn("+22650987654"));
        assertTrue(ex.getMessage().contains("KOSSA"));
        assertThrows(IllegalArgumentException.class, () -> reclamationService.validerMsisdn("+22674987654"));
    }

    @Test
    void validerMsisdn_acceptePrefixesKossaOfficiels() {
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22660010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22661010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22662010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22663010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22670010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22671010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22601010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22602010203"));
        assertDoesNotThrow(() -> reclamationService.validerMsisdn("+22603010203"));
    }

    @Test
    void validerMsisdn_refuseMauvaiseLongueur() {
        assertThrows(IllegalArgumentException.class, () -> reclamationService.validerMsisdn("+226700102"));
        assertThrows(IllegalArgumentException.class, () -> reclamationService.validerMsisdn(""));
        assertThrows(IllegalArgumentException.class, () -> reclamationService.validerMsisdn(null));
    }

    // ---------- POINT 1 : détermination du domaine ----------

    @Test
    void determinerDomaine_mappeLesTypes() {
        assertEquals("MOBILE_MONEY", reclamationService.determinerDomaine("Mobile Money"));
        assertEquals("FTTH", reclamationService.determinerDomaine("FTTH"));
        assertEquals("INTERNET", reclamationService.determinerDomaine("Internet"));
        assertEquals("FACTURATION", reclamationService.determinerDomaine("Facturation"));
        assertEquals("TECHNIQUE", reclamationService.determinerDomaine("Technique"));
        assertEquals("MOBILE_MONEY", reclamationService.determinerDomaine(null));
    }

    @Test
    void determinerSlaHeures_mappeLesTypes() {
        assertEquals(12, reclamationService.determinerSlaHeures("Mobile Money"));
        assertEquals(48, reclamationService.determinerSlaHeures("Facturation"));
        assertEquals(24, reclamationService.determinerSlaHeures("FTTH"));
        assertEquals(24, reclamationService.determinerSlaHeures("Internet"));
        assertEquals(24, reclamationService.determinerSlaHeures("Technique"));
        assertEquals(24, reclamationService.determinerSlaHeures(null));
    }

    // ---------- POINT 1 : création + affectation automatique N1 ----------

    @Test
    void creerReclamation_assigneDomaineEtEquipeN1() {
        Agent agent = agentRepository.findByEmail("agent2@kossa.bf").orElseThrow();

        Reclamation rec = reclamationService.creerReclamationAvecSla(
                "+22670010203", "TEST", "Integration",
                "Echec de transfert Kossa Money, montant debite non recu.",
                "Mobile Money", "CRITIQUE", "Agence", agent.getEmail());

        assertNotNull(rec.getId());
        assertEquals("OUVERT", rec.getStatut());
        assertEquals("MOBILE_MONEY", rec.getDomaine());
        assertNotNull(rec.getEquipeSupport());
        assertEquals("N1", rec.getEquipeSupport().getNiveau());
        assertEquals("MOBILE_MONEY", rec.getEquipeSupport().getDomaine());
        assertNotNull(rec.getDateEcheance());
        assertTrue(rec.getDateEcheance().after(rec.getDateCreation()));
    }

    @Test
    void creerReclamation_refuseMauvaisMsisdn() {
        Agent agent = agentRepository.findByEmail("agent@kossa.bf").orElseThrow();
        assertThrows(IllegalArgumentException.class, () ->
                reclamationService.creerReclamationAvecSla(
                        "+22650987654", "TEST", "Integration",
                        "Description valide assez longue pour le test.",
                        "Technique", "FAIBLE", "Web", agent.getEmail()));
    }

    // ---------- POINT 1 : contrôle de compétence (groupe de compétence) ----------

    @Test
    void verifierCompetenceDomaine_refuseAgentHorsDomaine() {
        Reclamation rec = reclamationRepository.findByStatut("OUVERT").stream()
                .filter(r -> "MOBILE_MONEY".equals(r.getDomaine()))
                .findFirst()
                .orElseGet(() -> {
                    Agent a = agentRepository.findByEmail("agent2@kossa.bf").orElseThrow();
                    return reclamationService.creerReclamationAvecSla(
                            "+22670010203", "TEST", "Integration",
                            "Description valide assez longue pour le test.",
                            "Mobile Money", "MOYENNE", "Agence", a.getEmail());
                });

        Agent agentInternet = agentRepository.findByEmail("agent4@kossa.bf").orElseThrow();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> reclamationService.verifierCompetenceDomaine(rec, agentInternet));
        assertTrue(ex.getMessage().contains("MOBILE_MONEY"));
        assertTrue(ex.getMessage().contains("INTERNET"));
    }

    @Test
    void verifierCompetenceDomaine_accepteAgentCompetent() {
        Reclamation rec = reclamationRepository.findByStatut("OUVERT").stream()
                .filter(r -> "MOBILE_MONEY".equals(r.getDomaine()))
                .findFirst()
                .orElseGet(() -> {
                    Agent a = agentRepository.findByEmail("agent2@kossa.bf").orElseThrow();
                    return reclamationService.creerReclamationAvecSla(
                            "+22670010203", "TEST", "Integration",
                            "Description valide assez longue pour le test.",
                            "Mobile Money", "MOYENNE", "Agence", a.getEmail());
                });

        Agent agentMobileMoney = agentRepository.findByEmail("agent2@kossa.bf").orElseThrow();
        assertDoesNotThrow(() -> reclamationService.verifierCompetenceDomaine(rec, agentMobileMoney));
    }

    // ---------- POINT 2 : flux d'escalade N1 -> N2 ----------

    @Test
    void workflowComplet_escaladeDemandeValideePuisN2() {
        Agent agentMM = agentRepository.findByEmail("agent2@kossa.bf").orElseThrow();
        Reclamation rec = reclamationService.creerReclamationAvecSla(
                "+22670010203", "TEST", "Integration",
                "Description valide assez longue pour le test d'escalade.",
                "Mobile Money", "MOYENNE", "Agence", agentMM.getEmail());

        // 1. Demande d'escalade N2 (statut DEMANDE) + ticket -> ESCALADE_N2 (cohérent avec le niveau demandé)
        Escalade demande = new Escalade();
        demande.setNiveau("N2");
        demande.setStatut("DEMANDE");
        demande.setMotif("Probleme expert non resolu au niveau 1.");
        demande.setReclamation(rec);
        escaladeRepository.save(demande);

        reclamationService.traiterReclamation(rec.getId(), "ESCALADE_N2",
                "Demande d'escalade N2.", null, null, agentMM.getEmail());

        Reclamation apresDemande = reclamationRepository.findById(rec.getId()).orElseThrow();
        assertEquals("ESCALADE_N2", apresDemande.getStatut());

        List<Escalade> demandes = escaladeRepository.findByStatut("DEMANDE");
        assertTrue(demandes.stream().anyMatch(e -> e.getReclamation().getId().equals(rec.getId())));

        // 2. Validation par le Manager -> ticket ESCALADE_N2 + équipe N2 du domaine
        EquipeSupport equipeN2 = equipeSupportRepository
                .findByNiveauAndDomaine("N2", "MOBILE_MONEY").orElseThrow();
        apresDemande.setEquipeSupport(equipeN2);
        reclamationRepository.save(apresDemande);

        Escalade validee = escaladeRepository.findById(demande.getId()).orElseThrow();
        validee.setStatut("VALIDEE");
        escaladeRepository.save(validee);

        reclamationService.traiterReclamation(rec.getId(), "ESCALADE_N2",
                "Escalade N2 validee par le Manager.", null, null, "manager@kossa.bf");

        Reclamation finale = reclamationRepository.findById(rec.getId()).orElseThrow();
        assertEquals("ESCALADE_N2", finale.getStatut());
        assertEquals("N2", finale.getEquipeSupport().getNiveau());
        assertEquals("MOBILE_MONEY", finale.getEquipeSupport().getDomaine());
    }

    @Test
    void regularationImmediate_puisValidationSuperviseur() {
        Agent agent = agentRepository.findByEmail("agent@kossa.bf").orElseThrow();
        Reclamation rec = reclamationService.creerReclamationAvecSla(
                "+22670010203", "TEST", "Integration",
                "Demande de remboursement d'un transfert Kossa Money.",
                "Mobile Money", "CRITIQUE", "Agence", agent.getEmail());

        // 1. Régularisation immédiate N1 possible depuis OUVERT
        Reclamation regularisee = reclamationService.traiterReclamation(
                rec.getId(), "REGULARISEE", "Régularisation immédiate en agence.",
                null, null, agent.getEmail());
        assertEquals("REGULARISEE", regularisee.getStatut());

        // 2. Réouverture impossible depuis un ticket non résolu
        assertThrows(IllegalArgumentException.class, () -> reclamationService.traiterReclamation(
                rec.getId(), "REOUVERT", "Tentative de réouverture illégale.", null, null, agent.getEmail()));
    }
}
