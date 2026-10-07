package com.kossa.controller;

import com.kossa.entity.Notification;
import com.kossa.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> mesNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.recupererParDestinataire(authentication.getName()));
    }

    @GetMapping("/non-lues")
    public ResponseEntity<?> nonLues(Authentication authentication) {
        return ResponseEntity.ok(notificationService.recupererNonLues(authentication.getName()));
    }

    @GetMapping("/compter-non-lues")
    public ResponseEntity<Map<String, Long>> compterNonLues(Authentication authentication) {
        Long count = notificationService.compterNonLues(authentication.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/lire")
    public ResponseEntity<Notification> marquerLue(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.marquerCommeLue(id));
    }
}
