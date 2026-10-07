package com.kossa.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${app.sms.enabled:true}")
    private boolean smsEnabled;

    public void envoyerSms(String numero, String message) {
        if (!smsEnabled) {
            log.debug("SMS désactivé - message non envoyé à {}", numero);
            return;
        }
        if (numero == null || numero.isBlank()) {
            log.warn("Numéro de téléphone manquant - SMS non envoyé");
            return;
        }
        log.info("📱 SMS envoyé à {} : {}", numero, message);
    }
}
