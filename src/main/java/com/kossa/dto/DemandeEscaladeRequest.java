package com.kossa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DemandeEscaladeRequest {

    @NotBlank(message = "Le motif de l'escalade est requis")
    @Size(min = 5, max = 500, message = "Le motif doit contenir entre 5 et 500 caractères")
    private String motif;

    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }
}