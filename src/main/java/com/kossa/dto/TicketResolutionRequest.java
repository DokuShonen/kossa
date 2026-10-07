package com.kossa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TicketResolutionRequest {

    @NotNull(message = "L'ID de la réclamation est requis")
    private Long reclamationId;

    @NotBlank(message = "La résolution est requise")
    private String resolution;

    public Long getReclamationId() { return reclamationId; }
    public void setReclamationId(Long reclamationId) { this.reclamationId = reclamationId; }
    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
}
