package com.kossa.dto;

import jakarta.validation.constraints.Email;

public class ValidationEscaladeRequest {

    @Email(message = "Format d'email invalide")
    private String agentEmail;

    private Long equipeSupportId;

    public String getAgentEmail() { return agentEmail; }
    public void setAgentEmail(String agentEmail) { this.agentEmail = agentEmail; }
    public Long getEquipeSupportId() { return equipeSupportId; }
    public void setEquipeSupportId(Long equipeSupportId) { this.equipeSupportId = equipeSupportId; }
}