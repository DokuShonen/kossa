package com.kossa.controller;

import com.kossa.dto.CreateUserRequest;
import com.kossa.dto.UpdateUserRequest;
import com.kossa.entity.*;
import com.kossa.repository.AgenceRepository;
import com.kossa.repository.AgentRepository;
import com.kossa.repository.EquipeSupportRepository;
import com.kossa.repository.UtilisateurRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private EquipeSupportRepository equipeSupportRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    private boolean estDansMonPerimetre(Utilisateur cible, Agence maAgence) {
        if (maAgence == null) return true;
        return cible.getAgence() != null && cible.getAgence().getId().equals(maAgence.getId());
    }

    @GetMapping
    public ResponseEntity<Page<Utilisateur>> getAllUsers(
            Pageable pageable,
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(auth, agenceIdHeader);
        if (agence != null) {
            return ResponseEntity.ok(utilisateurRepository.findByAgence(agence, pageable));
        }
        return ResponseEntity.ok(utilisateurRepository.findAll(pageable));
    }

    /** Agences disponibles pour domicilier un chargé de réclamation ou un chef d'agence. */
    @GetMapping("/agences")
    public ResponseEntity<List<Agence>> listerAgences(
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(auth, agenceIdHeader);
        if (agence != null) {
            return ResponseEntity.ok(List.of(agence));
        }
        return ResponseEntity.ok(agenceRepository.findAll());
    }

    @PostMapping("/agences")
    public ResponseEntity<?> creerAgence(@RequestBody Map<String, String> body) {
        String nom = body.get("nom");
        String ville = body.get("ville");
        String code = body.get("code");
        String region = body.get("region");
        if (nom == null || nom.isBlank()) {
            return ResponseEntity.badRequest().body("Le nom est obligatoire.");
        }
        if (agenceRepository.findByNom(nom.trim()).isPresent()) {
            return ResponseEntity.badRequest().body("Une agence avec ce nom existe déjà.");
        }
        Agence agence = new Agence();
        agence.setNom(nom.trim());
        agence.setVille(ville != null ? ville.trim() : null);
        agence.setCode(code != null ? code.trim() : null);
        agence.setRegion(region != null ? region.trim() : null);
        agenceRepository.save(agence);
        return ResponseEntity.ok(agence);
    }

    @PutMapping("/agences/{id}")
    public ResponseEntity<?> modifierAgence(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Agence agence = agenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agence introuvable"));
        String nom = body.get("nom");
        if (nom != null && !nom.isBlank()) {
            Optional<Agence> existante = agenceRepository.findByNom(nom.trim());
            if (existante.isPresent() && !existante.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Une agence avec ce nom existe déjà.");
            }
            agence.setNom(nom.trim());
        }
        if (body.containsKey("ville")) agence.setVille(body.get("ville") != null ? body.get("ville").trim() : null);
        if (body.containsKey("code")) agence.setCode(body.get("code") != null ? body.get("code").trim() : null);
        if (body.containsKey("region")) agence.setRegion(body.get("region") != null ? body.get("region").trim() : null);
        agenceRepository.save(agence);
        return ResponseEntity.ok(agence);
    }

    @DeleteMapping("/agences/{id}")
    public ResponseEntity<?> supprimerAgence(@PathVariable Long id) {
        Agence agence = agenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agence introuvable"));
        boolean hasUsers = utilisateurRepository.findByAgence(agence, org.springframework.data.domain.PageRequest.of(0, 1)).hasContent();
        if (hasUsers) {
            return ResponseEntity.badRequest().body("Impossible de supprimer : des utilisateurs sont rattachés à cette agence.");
        }
        agenceRepository.delete(agence);
        return ResponseEntity.ok("Agence supprimée.");
    }

    /** Équipes de support disponibles (domaine + niveau) pour affecter un agent. */
    @GetMapping("/equipes")
    public ResponseEntity<List<EquipeSupport>> listerEquipes(
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Agence agence = agenceSelectionnee(auth, agenceIdHeader);
        if (agence != null) {
            List<Agent> agentsAgence = agentRepository.findByAgence(agence);
            return ResponseEntity.ok(equipeSupportRepository.findAll().stream()
                    .filter(eq -> agentsAgence.stream().anyMatch(a -> a.getEquipeSupport() != null && a.getEquipeSupport().getId().equals(eq.getId())))
                    .toList());
        }
        return ResponseEntity.ok(equipeSupportRepository.findAll());
    }

    /** Affecte une équipe (domaine + niveau) à un agent existant → il apparaît alors dans les listes de sélection. */
    @PutMapping("/{id}/equipe")
    public ResponseEntity<?> affecterEquipe(
            @PathVariable Long id,
            @RequestBody Map<String, Long> payload,
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Long equipeSupportId = payload.get("equipeSupportId");
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (!(user instanceof Agent agent)) {
            return ResponseEntity.badRequest().body("Seul un agent peut être affecté à une équipe de support. Changez le rôle de cet utilisateur en 'Agent' d'abord.");
        }
        Agence maAgence = agenceSelectionnee(auth, agenceIdHeader);
        if (maAgence != null && (agent.getAgence() == null || !agent.getAgence().getId().equals(maAgence.getId()))) {
            return ResponseEntity.badRequest().body("Cet agent n'appartient pas à votre agence.");
        }
        if (equipeSupportId == null) {
            agent.setEquipeSupport(null);
            utilisateurRepository.save(agent);
            return ResponseEntity.ok("Équipe retirée à l'agent.");
        }
        EquipeSupport equipe = equipeSupportRepository.findById(equipeSupportId)
                .orElseThrow(() -> new RuntimeException("Équipe de support introuvable"));
        agent.setEquipeSupport(equipe);
        utilisateurRepository.save(agent);
        return ResponseEntity.ok(agent);
    }

    @PostMapping
    public ResponseEntity<?> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Cet email est déjà utilisé.");
        }

        Agence maAgence = agenceSelectionnee(auth, agenceIdHeader);

        String passwordChiffre = passwordEncoder.encode(request.getPassword());
        String nomComplet = (request.getNom() != null ? request.getNom() : "")
                + " " + (request.getPrenom() != null ? request.getPrenom() : "");

        Agence agence = null;
        if (request.getAgenceId() != null) {
            agence = agenceRepository.findById(request.getAgenceId())
                    .orElseThrow(() -> new RuntimeException("Agence introuvable"));
        }

        if (maAgence != null) {
            if (agence == null) {
                agence = maAgence;
            } else if (!agence.getId().equals(maAgence.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous ne pouvez créer des comptes que pour votre agence.");
            }
        }

        String role = request.getRole() != null ? request.getRole().toUpperCase() : "";

        if ("CHARGE_RECLAMATION".equals(role)) {
            Agent agent = new Agent();
            agent.setNom(nomComplet.trim());
            agent.setUsername(request.getEmail());
            agent.setEmail(request.getEmail());
            agent.setPassword(passwordChiffre);
            agent.setRole("ROLE_" + role);
            agent.setAgence(agence);
            if (request.getEquipeSupportId() != null) {
                agent.setEquipeSupport(equipeSupportRepository.findById(request.getEquipeSupportId())
                        .orElseThrow(() -> new RuntimeException("Équipe de support introuvable")));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(agentRepository.save(agent));
        } else if ("CHEF_AGENCE".equals(role) || "GESTIONNAIRE".equals(role) || "CHEF_SAV".equals(role)) {
            Manager manager = new Manager();
            manager.setNom(nomComplet.trim());
            manager.setUsername(request.getEmail());
            manager.setEmail(request.getEmail());
            manager.setPassword(passwordChiffre);
            manager.setRole("ROLE_" + role);
            manager.setDepartement(role);
            manager.setAgence(agence);
            if ("CHEF_SAV".equals(role) && request.getRegion() != null && !request.getRegion().isBlank()) {
                manager.setRegion(request.getRegion().trim());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurRepository.save(manager));
        } else if ("ADMIN".equals(role)) {
            Admin admin = new Admin();
            admin.setNom(nomComplet.trim());
            admin.setUsername(request.getEmail());
            admin.setEmail(request.getEmail());
            admin.setPassword(passwordChiffre);
            admin.setRole("ROLE_ADMIN");
            admin.setAgence(agence);
            return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurRepository.save(admin));
        } else if ("SUPERVISEUR".equals(role)) {
            Superviseur superviseur = new Superviseur();
            superviseur.setNom(nomComplet.trim());
            superviseur.setUsername(request.getEmail());
            superviseur.setEmail(request.getEmail());
            superviseur.setPassword(passwordChiffre);
            superviseur.setRole("ROLE_SUPERVISEUR");
            return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurRepository.save(superviseur));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Rôle non pris en charge.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Utilisateur cible = utilisateurRepository.findById(id).orElse(null);
        if (cible == null) return ResponseEntity.notFound().build();
        Agence maAgence = agenceSelectionnee(auth, agenceIdHeader);
        if (!estDansMonPerimetre(cible, maAgence)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        utilisateurRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication auth,
            @RequestHeader(value = "X-Agence-Id", required = false) Long agenceIdHeader) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Agence maAgence = agenceSelectionnee(auth, agenceIdHeader);
        if (!estDansMonPerimetre(user, maAgence)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous ne pouvez modifier que les comptes de votre agence.");
        }

        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()
                && !utilisateurRepository.findByEmail(request.getEmail()).get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Cet email est déjà utilisé par un autre compte.");
        }

        String nomComplet = (request.getNom() != null ? request.getNom() : "")
                + " " + (request.getPrenom() != null ? request.getPrenom() : "");
        user.setNom(nomComplet.trim());
        user.setEmail(request.getEmail());
        user.setUsername(request.getEmail());

        if (user instanceof Agent agent) {
            if (request.getEquipeSupportId() != null) {
                agent.setEquipeSupport(equipeSupportRepository.findById(request.getEquipeSupportId())
                        .orElseThrow(() -> new RuntimeException("Équipe de support introuvable")));
            } else {
                agent.setEquipeSupport(null);
            }
            if (request.getAgenceId() != null) {
                Agence nouvelleAgence = agenceRepository.findById(request.getAgenceId())
                        .orElseThrow(() -> new RuntimeException("Agence introuvable"));
                if (maAgence != null && !nouvelleAgence.getId().equals(maAgence.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous ne pouvez assigner que des comptes à votre agence.");
                }
                agent.setAgence(nouvelleAgence);
            }
        } else if (user instanceof Manager manager) {
            if (request.getRegion() != null && !request.getRegion().isBlank()) {
                manager.setRegion(request.getRegion().trim());
            }
            if (request.getAgenceId() != null) {
                Agence nouvelleAgence = agenceRepository.findById(request.getAgenceId())
                        .orElseThrow(() -> new RuntimeException("Agence introuvable"));
                if (maAgence != null && !nouvelleAgence.getId().equals(maAgence.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous ne pouvez assigner que des comptes à votre agence.");
                }
                manager.setAgence(nouvelleAgence);
            }
        }

        utilisateurRepository.save(user);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 8
                    || !request.getPassword().matches(".*[A-Z].*")
                    || !request.getPassword().matches(".*[a-z].*")
                    || !request.getPassword().matches(".*\\d.*")
                    || !request.getPassword().matches(".*[^A-Za-z0-9].*")) {
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            utilisateurRepository.save(user);
        }

        return ResponseEntity.ok("Utilisateur mis à jour avec succès.");
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("password");
        if (newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body("Le mot de passe ne peut pas être vide.");
        }
        if (!newPassword.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            return ResponseEntity.badRequest().body(
                    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        }
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setPassword(passwordEncoder.encode(newPassword));
        utilisateurRepository.save(user);
        return ResponseEntity.ok("Mot de passe mis à jour avec succès.");
    }
}
