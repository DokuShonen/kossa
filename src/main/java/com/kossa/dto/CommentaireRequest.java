package com.kossa.dto;

import jakarta.validation.constraints.NotBlank;

public class CommentaireRequest {

    @NotBlank(message = "Le contenu du commentaire est requis")
    private String contenu;

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }
}
