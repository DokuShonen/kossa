package com.kossa.dto;

import lombok.Data;

@Data
public class CreateUtilisateurDTO {
    private String username;
    private String password;
    private String email;
    private String role; // CLIENT, AGENT, CHEF_AGENCE, ADMIN
    // Champs spécifiques au CLIENT
    private String telephone;
    private String adresse;
}
