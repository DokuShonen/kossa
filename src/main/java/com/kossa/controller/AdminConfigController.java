package com.kossa.controller;

import com.kossa.dto.CategorieRequest;
import com.kossa.entity.*;
import com.kossa.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/config")
public class AdminConfigController {

    @Autowired private CategorieRepository categorieRepository;
    @Autowired private TypeReclamationRepository typeReclamationRepository;
    @Autowired private SLARepository slaRepository;
    @Autowired private RoleReferentielRepository roleReferentielRepository;

    @GetMapping("/categories")
    public ResponseEntity<Page<Categorie>> listerCategories(Pageable pageable) {
        return ResponseEntity.ok(categorieRepository.findAll(pageable));
    }

    @PostMapping("/categories")
    public ResponseEntity<Categorie> creerCategorie(@RequestBody CategorieRequest request) {
        Categorie categorie = new Categorie();
        categorie.setNom(request.getNom());
        categorie.setDescription(request.getDescription());
        if (request.getSlaId() != null) {
            categorie.setSla(slaRepository.findById(request.getSlaId())
                    .orElseThrow(() -> new RuntimeException("SLA introuvable")));
        }
        return ResponseEntity.ok(categorieRepository.save(categorie));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Categorie> modifierCategorie(@PathVariable Long id, @RequestBody CategorieRequest request) {
        Categorie existing = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        existing.setNom(request.getNom());
        existing.setDescription(request.getDescription());
        if (request.getSlaId() != null) {
            existing.setSla(slaRepository.findById(request.getSlaId())
                    .orElseThrow(() -> new RuntimeException("SLA introuvable")));
        } else {
            existing.setSla(null);
        }
        return ResponseEntity.ok(categorieRepository.save(existing));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> supprimerCategorie(@PathVariable Long id) {
        categorieRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/types-reclamation")
    public ResponseEntity<Page<TypeReclamation>> listerTypes(Pageable pageable) {
        return ResponseEntity.ok(typeReclamationRepository.findAll(pageable));
    }

    @PostMapping("/types-reclamation")
    public ResponseEntity<TypeReclamation> creerType(@RequestBody TypeReclamation type) {
        return ResponseEntity.ok(typeReclamationRepository.save(type));
    }

    @DeleteMapping("/types-reclamation/{id}")
    public ResponseEntity<Void> supprimerType(@PathVariable Long id) {
        if (!typeReclamationRepository.existsById(id)) {
            throw new RuntimeException("Type de réclamation introuvable");
        }
        typeReclamationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/types-reclamation/{id}")
    public ResponseEntity<TypeReclamation> modifierType(@PathVariable Long id, @RequestBody TypeReclamation type) {
        TypeReclamation existing = typeReclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Type de réclamation introuvable"));
        if (type.getNomType() == null || type.getNomType().isBlank()) {
            throw new RuntimeException("Le nom du type est obligatoire");
        }
        existing.setNomType(type.getNomType().trim());
        return ResponseEntity.ok(typeReclamationRepository.save(existing));
    }

    @GetMapping("/sla")
    public ResponseEntity<Page<SLA>> listerSLA(Pageable pageable) {
        return ResponseEntity.ok(slaRepository.findAll(pageable));
    }

    @PostMapping("/sla")
    public ResponseEntity<SLA> creerSLA(@RequestBody SLA sla) {
        return ResponseEntity.ok(slaRepository.save(sla));
    }

    @PutMapping("/sla/{id}")
    public ResponseEntity<SLA> modifierSLA(@PathVariable Long id, @RequestBody SLA sla) {
        SLA existing = slaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SLA introuvable"));
        existing.setTempsMaximumHeures(sla.getTempsMaximumHeures());
        existing.setNiveau(sla.getNiveau());
        return ResponseEntity.ok(slaRepository.save(existing));
    }

    @DeleteMapping("/sla/{id}")
    public ResponseEntity<Void> supprimerSLA(@PathVariable Long id) {
        if (!slaRepository.existsById(id)) {
            throw new RuntimeException("SLA introuvable");
        }
        slaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/roles")
    public ResponseEntity<Page<RoleReferentiel>> listerRoles(Pageable pageable) {
        return ResponseEntity.ok(roleReferentielRepository.findAll(pageable));
    }

    @PostMapping("/roles")
    public ResponseEntity<RoleReferentiel> creerRole(@RequestBody RoleReferentiel role) {
        if (role.getCode() == null || role.getCode().isBlank()
                || role.getLibelle() == null || role.getLibelle().isBlank()
                || role.getProfil() == null || role.getProfil().isBlank()) {
            throw new RuntimeException("Le code, le libellé et le profil du rôle sont obligatoires");
        }
        if (roleReferentielRepository.existsByCode(role.getCode())) {
            throw new RuntimeException("Un rôle avec ce code existe déjà");
        }
        return ResponseEntity.ok(roleReferentielRepository.save(role));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<RoleReferentiel> modifierRole(@PathVariable Long id, @RequestBody RoleReferentiel role) {
        RoleReferentiel existing = roleReferentielRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable"));
        existing.setLibelle(role.getLibelle());
        existing.setProfil(role.getProfil());
        existing.setNiveau(role.getNiveau());
        existing.setDescription(role.getDescription());
        return ResponseEntity.ok(roleReferentielRepository.save(existing));
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> supprimerRole(@PathVariable Long id) {
        if (!roleReferentielRepository.existsById(id)) {
            throw new RuntimeException("Rôle introuvable");
        }
        roleReferentielRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
