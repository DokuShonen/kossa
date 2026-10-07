package com.kossa.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

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

    private Long equipeSupportId;
    private Long agenceId;
    private String region;
    private String password;

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getEquipeSupportId() { return equipeSupportId; }
    public void setEquipeSupportId(Long equipeSupportId) { this.equipeSupportId = equipeSupportId; }
    public Long getAgenceId() { return agenceId; }
    public void setAgenceId(Long agenceId) { this.agenceId = agenceId; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
