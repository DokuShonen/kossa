package com.kossa.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@kossa.bf}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void envoyerEmail(String to, String sujet, String contenu) {
        if (!mailEnabled) {
            log.debug("Email désactivé (app.mail.enabled=false) - notification interne uniquement pour {}", to);
            return;
        }
        if (mailSender == null) {
            log.warn("MailSender non configuré - email non envoyé à {}", to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(sujet);
            message.setText(contenu);
            mailSender.send(message);
            log.info("Email envoyé à {}", to);
        } catch (Exception e) {
            log.error("Échec envoi email à {}: {}", to, e.getMessage());
        }
    }
}
