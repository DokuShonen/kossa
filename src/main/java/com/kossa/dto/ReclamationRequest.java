package com.kossa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ReclamationRequest {

    @NotBlank(message = "Le numéro MSISDN est obligatoire")
    @Pattern(
        regexp = "^(\\+?226|00226|226)?[0-9]{8}$",
        message = "Le MSISDN doit commencer par l'indicatif +226 et contenir 8 chiffres"
    )
    private String msisdn;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 60, message = "Le nom doit contenir entre 2 et 60 caractères")
    @Pattern(regexp = "^[\\p{L} '\\-]+$", message = "Le nom contient des caractères non autorisés")
    private String nom;

    @Size(max = 60, message = "Le prénom ne doit pas dépasser 60 caractères")
    @Pattern(regexp = "^[\\p{L} '\\-]*$", message = "Le prénom contient des caractères non autorisés")
    private String prenom;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
    @Pattern(regexp = "^[\\p{L}0-9 .,;:!?'\"()/\\-éèêëàâîôûùçÉÈÊËÀÂÎÔÛÙÇ%€]+$", message = "La description contient des caractères non autorisés")
    private String description;

    @NotBlank(message = "Le type est obligatoire")
    private String type;

    @NotBlank(message = "La priorité est obligatoire")
    private String priorite;

    private String canalNom;

    public String getMsisdn() { return msisdn; }
    public void setMsisdn(String msisdn) { this.msisdn = msisdn; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPriorite() { return priorite; }
    public void setPriorite(String priorite) { this.priorite = priorite; }
    public String getCanalNom() { return canalNom; }
    public void setCanalNom(String canalNom) { this.canalNom = canalNom; }
}