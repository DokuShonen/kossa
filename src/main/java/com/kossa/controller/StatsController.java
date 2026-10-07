package com.kossa.controller;

import com.kossa.entity.Manager;
import com.kossa.entity.Reclamation;
import com.kossa.entity.Utilisateur;
import com.kossa.entity.Agence;
import com.kossa.repository.ManagerRepository;
import com.kossa.repository.ReclamationRepository;
import com.kossa.repository.UtilisateurRepository;
import com.kossa.repository.AgenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private AgenceRepository agenceRepository;

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
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : aucune agence sélectionnée.");
        }
        return null;
    }

    /**
     * GET /api/stats/agent
     * Permet à l'agent de consulter ses propres statistiques
     */
    @GetMapping("/agent")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<Map<String, Object>> getAgentStats(Authentication authentication) {
        String agentEmail = authentication.getName();
        List<Reclamation> agentTickets = reclamationRepository.findByAgentEmail(agentEmail);
        return ResponseEntity.ok(calculerIndicateurs(agentTickets));
    }

    /**
     * GET /api/stats/global
     * Réservé au Manager - Statistiques consolidées de tous les agents pour la supervision
     */
    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('CHEF_AGENCE', 'GESTIONNAIRE', 'CHEF_SAV', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> getGlobalStats(
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        String role = authentication.getAuthorities().stream()
                .findFirst().map(a -> a.getAuthority()).orElse("");
        List<Reclamation> total;

        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            total = reclamationRepository.findByAgence_Id(agence.getId());
        } else if ("ROLE_CHEF_SAV".equals(role)) {
            Manager chefSav = managerRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Chef SAV non trouvé"));
            Agence agenceChef = chefSav.getAgence();
            total = (agenceChef != null)
                    ? reclamationRepository.findByAgence_IdAndSisav(agenceChef.getId(), chefSav.getEmail())
                    : List.of();
        } else {
            total = reclamationRepository.findAll();
        }
        return ResponseEntity.ok(calculerIndicateurs(total));
    }

    /**
     * GET /api/stats/periode
     * Permet d'extraire les réclamations sur une période donnée pour l'impression de rapports
     */
    @GetMapping("/periode")
    @PreAuthorize("hasAnyRole('AGENT', 'CHEF_AGENCE')")
    public ResponseEntity<List<Reclamation>> getTicketsByPeriode(
            @RequestParam("debut") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date debut,
            @RequestParam("fin") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date fin,
            Authentication authentication,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {

        List<Reclamation> tickets = reclamationRepository.findByDateCreationBetween(debut, fin);
        Agence agence = agenceSelectionnee(authentication, agenceIdHeader);
        if (agence != null) {
            tickets = tickets.stream()
                    .filter(r -> r.getAgence() != null && r.getAgence().getId().equals(agence.getId()))
                    .toList();
        }
        return ResponseEntity.ok(tickets);
    }

    private Map<String, Object> calculerIndicateurs(List<Reclamation> liste) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", liste.size());

        // Groupement par Statut
        Map<String, Long> parStatut = liste.stream()
                .collect(Collectors.groupingBy(Reclamation::getStatut, Collectors.counting()));
        stats.put("parStatut", parStatut);

        // Groupement par Priorité
        Map<String, Long> parPriorite = liste.stream()
                .collect(Collectors.groupingBy(Reclamation::getPriorite, Collectors.counting()));
        stats.put("parPriorite", parPriorite);

        // Groupement par Agent (Supervision)
        Map<String, Long> parAgent = liste.stream()
                .filter(r -> r.getAgent() != null)
                .collect(Collectors.groupingBy(r -> r.getAgent().getNom(), Collectors.counting()));
        stats.put("parAgent", parAgent);

        return stats;
    }
}
