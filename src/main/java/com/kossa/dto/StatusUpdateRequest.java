package com.kossa.dto;

import jakarta.validation.constraints.NotBlank;

public class StatusUpdateRequest {

    @NotBlank(message = "Le statut est requis")
    private String statut;

    private String commentaire;
    private String planAction;
    private String affecteA;

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
    public String getPlanAction() { return planAction; }
    public void setPlanAction(String planAction) { this.planAction = planAction; }
    public String getAffecteA() { return affecteA; }
    public void setAffecteA(String affecteA) { this.affecteA = affecteA; }
}
