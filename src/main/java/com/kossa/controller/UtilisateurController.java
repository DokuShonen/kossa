package com.kossa.controller;

import com.kossa.entity.*;
import com.kossa.repository.ClientRepository;
import com.kossa.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/utilisateurs")
@PreAuthorize("hasRole('ADMIN')")
public class UtilisateurController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<Page<Utilisateur>> getAll(Pageable pageable) {
        return ResponseEntity.ok(utilisateurRepository.findAll(pageable));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> payload) {
        String role = payload.get("role");

        if ("CLIENT".equals(role)) {
            Client client = new Client();
            client.setNom(payload.get("username"));
            client.setPrenom("");
            client.setMsisdn(payload.get("telephone"));
            client.setAdresse(payload.get("adresse"));
            return ResponseEntity.status(HttpStatus.CREATED).body(clientRepository.save(client));
        }

        if (utilisateurRepository.findByEmail(payload.get("email")).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Cet email est déjà pris.");
        }

        Utilisateur user;
        if ("ADMIN".equals(role)) {
            user = new Admin();
        } else if ("CHEF_AGENCE".equals(role) || "CHEF_SAV".equals(role) || "GESTIONNAIRE".equals(role)) {
            user = new Manager();
        } else {
            user = new Agent();
        }

        String password = payload.get("password");
        if (password == null || !password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        }
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(payload.get("email"));
        user.setRole(role);
        user.setNom(payload.get("username"));
        user.setUsername(payload.get("email"));

        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        utilisateurRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
