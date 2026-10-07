package com.kossa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EscaladeRequest {

    @NotNull(message = "L'ID de la réclamation est requis")
    private Long reclamationId;

    @NotBlank(message = "Le niveau d'escalade est requis")
    private String niveau;

    private String motif;

    public Long getReclamationId() { return reclamationId; }
    public void setReclamationId(Long reclamationId) { this.reclamationId = reclamationId; }
    public String getNiveau() { return niveau; }
    public void setNiveau(String niveau) { this.niveau = niveau; }
    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }
}
