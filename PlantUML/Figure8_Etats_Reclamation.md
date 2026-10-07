# Figure 8 : Diagramme d'états d'une réclamation

Ce diagramme illustre le cycle de vie d'une réclamation depuis sa création jusqu'à sa clôture.

## Code PlantUML

```plantuml
@startuml Diagramme_Etats_Reclamation

skinparam shadowing true
skinparam backgroundColor #FFFFFF
skinparam state {
    BackgroundColor #F8F9FA
    BorderColor #0060A8
    FontColor #0060A8
    FontSize 12
    FontName Arial
}

skinparam transition {
    FontColor #0060A8
    FontSize 11
}

' --- ÉTAT INITIAL ---
[*] --> OUVERT : Création de la réclamation\n(Agent de Support)

' --- ÉTATS PRINCIPAUX ---
state OUVERT {
    note right of OUVERT
        Réclamation créée
        En attente d'affectation
    end note
}

state ASSIGNE {
    note right of ASSIGNE
        Affecté à un Agent N1
        du domaine compétent
    end note
}

state ASSIGNE_SISAV {
    note right of ASSIGNE_SISAV
        Transmis au Chef SAV
        (SISAV)
    end note
}

state EN_TRAITEMENT {
    note right of EN_TRAITEMENT
        Agent en cours
        de traitement
    end note
}

state EN_COURS {
    note right of EN_COURS
        Ticket actif
        En cours de résolution
    end note
}

' --- ÉTATS DE RÉSOLUTION ---
state RESOLU {
    note right of RESOLU
        Problème résolu
        En attente clôture
    end note
}

state REGULARISEE {
    note right of REGULARISEE
        Régularisation immédiate
        par l'Agent N1
    end note
}

state CLOTURE {
    note right of CLOTURE
        Réclamation clôturée
        Archivée
    end note
    style CLOTURE #E8F5E9
}

' --- ÉTATS DE SUPERVISION ---
state EN_ATTENTE_SUPERVISEUR {
    note right of EN_ATTENTE_SUPERVISEUR
        Dérogation/Remboursement
        Soumis au Superviseur
    end note
}

' --- ÉTATS D'ESCALADE ---
state ESCALADE_N1 {
    note right of ESCALADE_N1
        Escalade niveau 1
        Demandée
    end note
}

state ESCALADE_N2 {
    note right of ESCALADE_N2
        Escalade niveau 2
        Expert N2 en cours
    end note
}

state REOUVERT {
    note right of REOUVERT
        Réouvert depuis
        RESOLU/CLOTURE
    end note
}

' --- TRANSITIONS ---
OUVERT --> ASSIGNE : Affectation Agent N1\n(Chef d'agence)
OUVERT --> ASSIGNE_SISAV : Transmission SAV\n(Chef d'agence)

ASSIGNE --> EN_TRAITEMENT : Prise en charge\n(Agent N1)
ASSIGNE_SISAV --> EN_TRAITEMENT : Prise en charge\n(Agent SAV)

EN_TRAITEMENT --> RESOLU : Résolution standard
EN_TRAITEMENT --> REGULARISEE : Régularisation immédiate
EN_TRAITEMENT --> EN_ATTENTE_SUPERVISEUR : Dérogation/Remboursement
EN_TRAITEMENT --> ESCALADE_N1 : Demande escalade N1

EN_COURS --> RESOLU : Résolution
EN_COURS --> EN_ATTENTE_SUPERVISEUR : Dérogation
EN_COURS --> ESCALADE_N1 : Escalade N1

RESOLU --> CLOTURE : Validation Chef d'agence

REGULARISEE --> CLOTURE : Validation

EN_ATTENTE_SUPERVISEUR --> RESOLU : Superviseur valide
EN_ATTENTE_SUPERVISEUR --> EN_COURS : Superviseur rejette

ESCALADE_N1 --> ESCALADE_N2 : Chef d'agence valide
ESCALADE_N1 --> EN_COURS : Chef d'agence rejette

ESCALADE_N2 --> RESOLU : Expert N2 résout

CLOTURE --> REOUVERT : Réouverture\n(Client/Admin)
REOUVERT --> EN_COURS : Reprise traitement

' --- ÉTAT FINAL ---
CLOTURE --> [*]

' --- LÉGENDE ---
legend bottom
  **Légende des transitions :**
  - **Bleu** : transitions normales
  - **Orange** : escalades
  - **Vert** : clôture
  - **Gris** : réouverture
end legend

@enduml
```

## Description

### États principaux

| État | Description |
|------|-------------|
| **OUVERT** | Réclamation créée, en attente d'affectation |
| **ASSIGNE** | Affecté à un Agent N1 du domaine compétent |
| **ASSIGNE_SISAV** | Transmis au Chef SAV (SISAV) |
| **EN_TRAITEMENT** | Agent en cours de traitement |
| **EN_COURS** | Ticket actif, en cours de résolution |
| **RESOLU** | Problème résolu, en attente clôture |
| **REGULARISEE** | Régularisation immédiate par l'Agent N1 |
| **CLOTURE** | Réclamation clôturée et archivée |
| **EN_ATTENTE_SUPERVISEUR** | Dérogation/Remboursement soumis au Superviseur |
| **ESCALADE_N1** | Escalade niveau 1 demandée |
| **ESCALADE_N2** | Escalade niveau 2, expert N2 en cours |
| **REOUVERT** | Réouvert depuis RESOLU/CLOTURE |

### Transitions principales

| De | Vers | Action | Acteur |
|----|------|--------|--------|
| OUVERT | ASSIGNE | Affectation Agent N1 | Chef d'agence |
| OUVERT | ASSIGNE_SISAV | Transmission SAV | Chef d'agence |
| ASSIGNE | EN_TRAITEMENT | Prise en charge | Agent N1 |
| EN_TRAITEMENT | RESOLU | Résolution standard | Agent |
| EN_TRAITEMENT | REGULARISEE | Régularisation immédiate | Agent |
| EN_TRAITEMENT | EN_ATTENTE_SUPERVISEUR | Dérogation | Agent |
| EN_TRAITEMENT | ESCALADE_N1 | Demande escalade | Agent |
| EN_ATTENTE_SUPERVISEUR | RESOLU | Validation | Superviseur |
| EN_ATTENTE_SUPERVISEUR | EN_COURS | Rejet | Superviseur |
| ESCALADE_N1 | ESCALADE_N2 | Validation | Chef d'agence |
| ESCALADE_N2 | RESOLU | Résolution | Expert N2 |
| RESOLU | CLOTURE | Validation | Chef d'agence |
| CLOTURE | REOUVERT | Réouverture | Client/Admin |

*(Source : réalisation personnelle)*
