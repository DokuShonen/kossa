package com.kossa.service;

import com.kossa.entity.*;
import com.kossa.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class SlaMonitorService {

    private static final Logger log = LoggerFactory.getLogger(SlaMonitorService.class);

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private EscaladeRepository escaladeRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void verifierSLA() {
        log.debug("Vérification SLA - recherche des réclamations en dépassement");

        List<Reclamation> depassees = reclamationRepository.findByDateEcheanceBeforeAndStatutNotIn(
                new Date(),
                List.of("RESOLU", "CLOTURE")
        );

        for (Reclamation rec : depassees) {
            boolean escaladeActive = escaladeRepository.findByReclamation_Id(rec.getId())
                    .stream()
                    .anyMatch(e -> "EN_ATTENTE".equals(e.getStatut()) || "EN_COURS".equals(e.getStatut()));

            boolean n1Validee = escaladeRepository.findByReclamation_Id(rec.getId())
                    .stream()
                    .anyMatch(e -> "N1".equals(e.getNiveau()) && "VALIDEE".equals(e.getStatut()));

            if (escaladeActive) {
                continue;
            }

            // Si la N1 a déjà été validée sans effet, escalade automatique en N2
            if (n1Validee) {
                Escalade esc = new Escalade();
                esc.setNiveau("N2");
                esc.setStatut("EN_ATTENTE");
                esc.setDateEscalade(new Date());
                esc.setMotif("Dépassement du délai SLA après escalade N1 - escalade automatique N2. Échéance: " + rec.getDateEcheance());
                esc.setReclamation(rec);
                escaladeRepository.save(esc);

                notificationService.notifierEscalade(rec, "N2", null);
                log.warn("Escalade N2 automatique créée pour la réclamation {}", rec.getReference());
                continue;
            }

            Escalade esc = new Escalade();
            esc.setNiveau("N1");
            esc.setStatut("EN_ATTENTE");
            esc.setDateEscalade(new Date());
            esc.setMotif("Dépassement du délai SLA - Échéance: " + rec.getDateEcheance());
            esc.setReclamation(rec);
            escaladeRepository.save(esc);

            notificationService.notifierEscalade(rec, "N1", null);
            log.warn("Escalade N1 créée pour la réclamation {}", rec.getReference());
        }

        if (!depassees.isEmpty()) {
            log.info("Vérification SLA terminée: {} réclamation(s) en dépassement", depassees.size());
        }
    }
}
