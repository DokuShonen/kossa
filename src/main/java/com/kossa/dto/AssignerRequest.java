package com.kossa.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AssignerRequest {

    @NotBlank(message = "L'email de l'agent est requis")
    @Email(message = "Format d'email invalide")
    private String agentEmail;

    public String getAgentEmail() { return agentEmail; }
    public void setAgentEmail(String agentEmail) { this.agentEmail = agentEmail; }
}
