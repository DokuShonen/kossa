package com.kossa.enums;

public enum StatutReclamation {
    OUVERT("OUVERT"),
    ASSIGNE("ASSIGNE"),
    EN_TRAITEMENT("EN_TRAITEMENT"),
    EN_COURS("EN_COURS"),
    ASSIGNE_SISAV("ASSIGNE_SISAV"),
    RESOLU("RESOLU"),
    CLOTURE("CLOTURE"),
    REOUVERT("REOUVERT"),
    REGULARISEE("REGULARISEE"),
    VALIDATION_SUPERVISEUR("VALIDATION_SUPERVISEUR"),
    EN_ATTENTE_SUPERVISEUR("EN_ATTENTE_SUPERVISEUR"),
    ESCALADE_N1("ESCALADE_N1"),
    ESCALADE_N2("ESCALADE_N2"),
    DEMANDE("DEMANDE"),
    VALIDEE("VALIDEE"),
    REJETEE("REJETEE");

    private final String code;

    StatutReclamation(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static boolean estValide(String valeur) {
        if (valeur == null) return false;
        for (StatutReclamation s : values()) {
            if (s.code.equalsIgnoreCase(valeur)) return true;
        }
        return false;
    }

    public static boolean estFermeture(String valeur) {
        return "CLOTURE".equalsIgnoreCase(valeur);
    }

    public static boolean estOuvertOuTraitement(String valeur) {
        return "OUVERT".equalsIgnoreCase(valeur) || "ASSIGNE".equalsIgnoreCase(valeur)
                || "EN_TRAITEMENT".equalsIgnoreCase(valeur) || "EN_COURS".equalsIgnoreCase(valeur)
                || "REOUVERT".equalsIgnoreCase(valeur);
    }
}