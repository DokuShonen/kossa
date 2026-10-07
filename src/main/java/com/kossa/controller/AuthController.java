package com.kossa.controller;

import com.kossa.dto.LoginRequest;
import com.kossa.dto.LoginResponse;
import com.kossa.entity.*;
import com.kossa.repository.UtilisateurRepository;
import com.kossa.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        Utilisateur utilisateur = utilisateurRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        LoginResponse response = new LoginResponse();
        response.setToken(jwt);
        response.setId(utilisateur.getId());
        response.setNom(utilisateur.getNom());
        response.setEmail(utilisateur.getEmail());
        response.setRole(utilisateur.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        Utilisateur u = utilisateurRepository.findByEmail(authentication.getName())
                .orElse(null);
        if (u == null) return ResponseEntity.status(404).build();

        java.util.Map<String, Object> profile = new java.util.LinkedHashMap<>();
        profile.put("id", u.getId());
        profile.put("nom", u.getNom());
        profile.put("email", u.getEmail());
        profile.put("role", u.getRole());
        profile.put("username", u.getUsername());

        if (u instanceof Agent a) {
            profile.put("matricule", a.getMatricule());
            if (a.getEquipeSupport() != null) {
                java.util.Map<String, Object> eq = new java.util.LinkedHashMap<>();
                eq.put("id", a.getEquipeSupport().getId());
                eq.put("nom", a.getEquipeSupport().getNom());
                eq.put("domaine", a.getEquipeSupport().getDomaine());
                eq.put("niveau", a.getEquipeSupport().getNiveau());
                profile.put("equipeSupport", eq);
            }
        }
        if (u instanceof Manager m) {
            profile.put("region", m.getRegion());
            profile.put("departement", m.getDepartement());
        }
        if (u instanceof Superviseur s) {
            profile.put("departement", s.getDepartement());
            if (s.getEquipeSupervisee() != null) {
                java.util.Map<String, Object> eq = new java.util.LinkedHashMap<>();
                eq.put("id", s.getEquipeSupervisee().getId());
                eq.put("nom", s.getEquipeSupervisee().getNom());
                eq.put("domaine", s.getEquipeSupervisee().getDomaine());
                profile.put("equipeSupervisee", eq);
            }
        }
        if (u.getAgence() != null) {
            java.util.Map<String, Object> ag = new java.util.LinkedHashMap<>();
            ag.put("id", u.getAgence().getId());
            ag.put("nom", u.getAgence().getNom());
            ag.put("ville", u.getAgence().getVille());
            ag.put("code", u.getAgence().getCode());
            ag.put("region", u.getAgence().getRegion());
            profile.put("agence", ag);
        }

        return ResponseEntity.ok(profile);
    }
}
