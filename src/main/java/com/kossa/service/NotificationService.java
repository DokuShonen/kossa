package com.kossa.service;

import com.kossa.entity.*;
import com.kossa.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private EmailService emailService;
    @Autowired private SmsService smsService;

    @Transactional
    public Notification envoyerNotification(String type, String contenu, String destinataire,
                                            Long reclamationId, String nomCanal) {
        Notification notif = new Notification();
        notif.setType(type);
        notif.setContenu(contenu);
        notif.setDestinataire(destinataire);
        notif.setDateEnvoi(new Date());
        notif.setStatut("NON_LUE");
        notificationRepository.save(notif);

        emailService.envoyerEmail(destinataire, "[Kossa] " + type, contenu);
        return notif;
    }

    @Transactional
    public Notification notifierClientCreation(Reclamation rec, Canal canal) {
        String contenu = "Votre réclamation " + rec.getReference() + " a bien été enregistrée. Statut : " + rec.getStatut();
        smsService.envoyerSms(rec.getClient().getMsisdn(), contenu);
        return envoyerNotification("CREATION", contenu,
                rec.getClient().getMsisdn(), rec.getId(), null);
    }

    @Transactional
    public Notification notifierClientChangementStatut(Reclamation rec, String ancienStatut, Canal canal) {
        String contenu = "La réclamation " + rec.getReference() + " est passée de [" + ancienStatut + "] à [" + rec.getStatut() + "].";
        smsService.envoyerSms(rec.getClient().getMsisdn(), contenu);
        return envoyerNotification("CHANGEMENT_STATUT", contenu,
                rec.getClient().getMsisdn(), rec.getId(), null);
    }

    @Transactional
    public List<Notification> notifierEscalade(Reclamation rec, Manager manager, String motif) {
        String contenu = "Escalade de la réclamation " + rec.getReference() + " pour motif : " + motif;
        List<Notification> notifs = new ArrayList<>();

        Notification notifManager = envoyerNotification("ESCALADE", contenu,
                manager.getEmail(), rec.getId(), null);
        notifs.add(notifManager);

        if (rec.getAgent() != null) {
            Notification notifAgent = envoyerNotification("ESCALADE", contenu,
                    rec.getAgent().getEmail(), rec.getId(), null);
            notifs.add(notifAgent);
        }

        return notifs;
    }

    @Transactional
    public Notification notifierEscalade(Reclamation rec, String niveau, String canal) {
        String contenu = "Escalade N" + niveau + " déclenchée pour la réclamation " + rec.getReference();
        return envoyerNotification("ESCALADE_AUTO", contenu,
                rec.getAgent() != null ? rec.getAgent().getEmail() : "manager@kossa.bf",
                rec.getId(), canal);
    }

    @Transactional
    public Notification notifierValidation(Reclamation rec, String decision, Canal canal) {
        String contenu = "La résolution de " + rec.getReference() + " a été " + decision + ".";
        smsService.envoyerSms(rec.getClient().getMsisdn(), contenu);
        return envoyerNotification("VALIDATION", contenu,
                rec.getClient().getMsisdn(), rec.getId(), null);
    }

    public List<Notification> recupererParDestinataire(String email) {
        return notificationRepository.findByDestinataire(email);
    }

    public List<Notification> recupererNonLues(String email) {
        return notificationRepository.findNonLuesByEmail(email);
    }

    public Long compterNonLues(String email) {
        return notificationRepository.countNonLuesByEmail(email);
    }

    @Transactional
    public Notification marquerCommeLue(Long id) {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));
        notif.setStatut("LUE");
        return notificationRepository.save(notif);
    }
}
