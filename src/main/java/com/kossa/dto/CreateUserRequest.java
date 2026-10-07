package com.kossa.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotBlank(message = "Le nom est requis")
    @Size(min = 2, max = 60, message = "Le nom doit contenir entre 2 et 60 caractères")
    @Pattern(regexp = "^[\\p{L} '\\-]+$", message = "Le nom contient des caractères non autorisés")
    private String nom;

    @Size(max = 60, message = "Le prénom ne doit pas dépasser 60 caractères")
    @Pattern(regexp = "^[\\p{L} '\\-]*$", message = "Le prénom contient des caractères non autorisés")
    private String prenom;

    @NotBlank(message = "L'email est requis")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 8, max = 100, message = "Le mot de passe doit contenir au moins 8 caractères")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
    )
    private String password;

    @NotBlank(message = "Le rôle est requis")
    private String role;

    /** Équipe support (domaine + niveau)   obligatoire pour le rôle AGENT. */
    private Long equipeSupportId;

    /** Agence (domiciliation)   pour les chargés de réclamation et chefs d'agence. */
    private Long agenceId;

    /** Région (Direction Régionale)   pour les chefs SAV. */
    private String region;

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getEquipeSupportId() { return equipeSupportId; }
    public void setEquipeSupportId(Long equipeSupportId) { this.equipeSupportId = equipeSupportId; }
    public Long getAgenceId() { return agenceId; }
    public void setAgenceId(Long agenceId) { this.agenceId = agenceId; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
}