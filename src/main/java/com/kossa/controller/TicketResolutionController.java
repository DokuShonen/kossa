package com.kossa.controller;

import com.kossa.dto.TicketResolutionRequest;
import com.kossa.entity.TicketResolution;
import com.kossa.repository.TicketResolutionRepository;
import com.kossa.repository.ReclamationRepository;
import com.kossa.entity.Reclamation;
import com.kossa.service.NotificationService;
import com.kossa.service.ReclamationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets-resolution")
public class TicketResolutionController {

    @Autowired private TicketResolutionRepository ticketResolutionRepository;
    @Autowired private ReclamationRepository reclamationRepository;
    @Autowired private ReclamationService reclamationService;
    @Autowired private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<TicketResolution> creer(@Valid @RequestBody TicketResolutionRequest request,
                                                   Authentication authentication) {
        Reclamation rec = reclamationRepository.findById(request.getReclamationId())
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));

        TicketResolution ticket = new TicketResolution();
        ticket.setReclamation(rec);
        ticket.setResolution(request.getResolution());
        ticket.setDateResolution(new Date());
        ticket.setStatutValidation("EN_ATTENTE");

        reclamationService.traiterReclamation(request.getReclamationId(), "RESOLU",
                "Résolution créée", null, null, authentication.getName());

        TicketResolution saved = ticketResolutionRepository.save(ticket);
        notificationService.notifierValidation(rec, "soumise pour validation", null);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<TicketResolution> valider(@PathVariable Long id, Authentication authentication) {
        TicketResolution ticket = ticketResolutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket de résolution introuvable"));

        ticket.setStatutValidation("VALIDEE");
        reclamationService.traiterReclamation(ticket.getReclamation().getId(), "CLOTURE",
                "Résolution validée", null, null, authentication.getName());
        notificationService.notifierValidation(ticket.getReclamation(), "validée", null);

        return ResponseEntity.ok(ticketResolutionRepository.save(ticket));
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<TicketResolution> rejeter(@PathVariable Long id,
                                                     @RequestBody Map<String, String> payload,
                                                     Authentication authentication) {
        TicketResolution ticket = ticketResolutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket de résolution introuvable"));

        ticket.setStatutValidation("REJETEE");
        String motif = payload.getOrDefault("motif", "Non précisé");
        reclamationService.traiterReclamation(ticket.getReclamation().getId(), "EN_COURS",
                "Résolution rejetée: " + motif, null, null, authentication.getName());
        notificationService.notifierValidation(ticket.getReclamation(), "rejetée", null);

        return ResponseEntity.ok(ticketResolutionRepository.save(ticket));
    }

    @GetMapping("/reclamation/{reclamationId}")
    public ResponseEntity<TicketResolution> parReclamation(@PathVariable Long reclamationId) {
        return ticketResolutionRepository.findByReclamationId(reclamationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
