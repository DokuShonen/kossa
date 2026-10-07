package com.kossa.dto;

import lombok.Data;

@Data
public class ReclamationDTO {
    private String objet;
    private String description;
    private String type;      // Technique, Facturation, Mobile Money, VAS, Fraude, Autre
    private String canal;     // Call Center, Web, Agence, Email, WhatsApp, Facebook, SMS
    private String priorite;  // Basse, Haute, Critique
    private Long clientId;
}
