# Diagrammes de Séquence UML - Kossa

Ce document contient les diagrammes de séquence (Sequence Diagrams) modélisant les flux d'exécution dynamiques et les interactions entre l'interface Frontend React, le Backend Spring Boot, les composants de sécurité JWT, la base de données PostgreSQL et les tâches d'arrière-plan.

---

## 1. Création d'une réclamation & Affectation Automatique N1

```plantuml
@startuml Sequence_Creation_Reclamation

autonumber
skinparam shadowing true
skinparam backgroundColor #FFFFFF

actor "Agent Support" as Agent
participant "React App\n(DashboardAgent)" as Frontend
participant "JwtAuthenticationFilter" as AuthFilter
participant "ReclamationController" as Controller
participant "ReclamationService" as Service
participant "NotificationService" as NotifService
database "PostgreSQL" as DB

Agent -> Frontend : Renseigne le formulaire (Client, MSISDN, Type, Objet)
Frontend -> Frontend : Pré-validation frontend (MSISDN +226, 8 chiffres)
Frontend -> AuthFilter : POST /api/reclamations\n[Header: Bearer JWT, X-Agence-Id]
activate AuthFilter

AuthFilter -> AuthFilter : Valider le token JWT & Rôle AGENT
AuthFilter -> Controller : Transmettre la requête authentifiée
activate Controller

Controller -> Service : creerReclamation(dto)
activate Service

Service -> Service : validerMsisdn(msisdn) [Regex +226/KOSSA]
Service -> Service : determinerDomaine(type) [ex: FACTURATION, TECHNIQUE]
Service -> Service : determinerSlaHeures(type, categorie)

Service -> DB : findByNiveauAndDomaine("N1", domaine)
DB --> Service : EquipeSupport N1

Service -> DB : save(reclamation)\n[Statut: OUVERT, Equipe: N1]
DB --> Service : Reclamation enregistrée (ID, Réf KOSSA-XXXX)

Service -> NotifService : notifierNouvelleReclamation(reclamation)
activate NotifService
NotifService -> DB : save(notification)
NotifService --> Service : Notification créée
deactivate NotifService

Service --> Controller : ReclamationDTO
deactivate Service

Controller --> Frontend : 201 Created (ReclamationDTO)
deactivate Controller
deactivate AuthFilter

Frontend --> Agent : Message de confirmation avec référence KOSSA-XXXX
@enduml
```

---

## 2. Assignation par le Manager avec contrôle de compétence

```plantuml
@startuml Sequence_Assignation_Manager

autonumber
skinparam shadowing true
skinparam backgroundColor #FFFFFF

actor "Chef d'agence" as ChefAgence
participant "React App\n(ManagerDashboard)" as Frontend
participant "ManagerController" as Controller
participant "ReclamationService" as Service
database "PostgreSQL" as DB

ChefAgence -> Frontend : Sélectionne ticket & choisit un agent N1
Frontend -> Controller : PUT /api/manager/reclamations/{id}/assigner\n[Body: agentId]
activate Controller

Controller -> Service : assignerAgent(idTicket, idAgent)
activate Service

Service -> DB : findById(idTicket)
DB --> Service : Reclamation

Service -> DB : findById(idAgent)
DB --> Service : Agent

Service -> Service : verifierCompetenceDomaine(agent, reclamation)\n[Vérifie agent.equipeSupport.domaine == reclamation.domaine]

alt Domaine Incompatible
    Service --> Controller : Lancer IllegalArgumentException("Agent hors domaine")
    Controller --> Frontend : 400 Bad Request ("Agent non qualifié pour ce domaine")
    Frontend --> ChefAgence : Afficher alerte d'incompatibilité de domaine
else Domaine Compatible
    Service -> DB : update reclamation\n[set agent_id, statut = 'ASSIGNE']
    DB --> Service : OK
    Service --> Controller : Reclamation mise à jour
    Controller --> Frontend : 200 OK (ReclamationDTO)
    Frontend --> ChefAgence : Ticket assigné avec succès
end

deactivate Service
deactivate Controller
@enduml
```

---

## 3. Demande & Validation d'Escalade N1 → N2

```plantuml
@startuml Sequence_Escalade_N1_N2

autonumber
skinparam shadowing true
skinparam backgroundColor #FFFFFF

actor "Agent N1" as Agent
actor "Chef d'agence" as ChefAgence
participant "React App" as Frontend
participant "ReclamationController" as RecController
participant "ManagerController" as MgrController
participant "ReclamationService" as Service
database "PostgreSQL" as DB

== Étape 1 : Demande d'escalade par l'Agent ==
Agent -> Frontend : Saisit le motif & clique "Demander Escalade N2"
Frontend -> RecController : POST /api/reclamations/{id}/demander-escalade\n[Body: motif]
activate RecController

RecController -> Service : demanderEscalade(id, motif)
activate Service
Service -> DB : save(Escalade N1, Statut: DEMANDE)
Service -> DB : update Reclamation\n[Statut = 'ESCALADE_N1']
Service --> RecController : OK
deactivate Service

RecController --> Frontend : 200 OK (Statut ESCALADE_N1)
deactivate RecController
Frontend --> Agent : Statut mis à jour : ESCALADE_N1

== Étape 2 : Décision du Manager ==
ChefAgence -> Frontend : Consulte l'onglet "Demandes d'Escalade"
Frontend -> MgrController : PUT /api/manager/escalades/{id}/valider
activate MgrController

MgrController -> Service : validerEscalade(idEscalade)
activate Service
Service -> DB : findByNiveauAndDomaine("N2", domaineTicket)
DB --> Service : EquipeSupport N2

Service -> DB : update Escalade [statut = 'VALIDEE']
Service -> DB : update Reclamation\n[statut = 'ESCALADE_N2', equipe_support = Equipe N2]
Service --> MgrController : Escalade Validée
deactivate Service

MgrController --> Frontend : 200 OK
deactivate MgrController
Frontend --> ChefAgence : Escalade validée, transmise à l'Équipe N2
@enduml
```

---

## 4. Soumission & Validation de Dérogation par le Superviseur

```plantuml
@startuml Sequence_Validation_Superviseur

autonumber
skinparam shadowing true
skinparam backgroundColor #FFFFFF

actor "Agent Support" as Agent
actor "Superviseur Agence" as Superviseur
participant "React App" as Frontend
participant "ReclamationController" as RecController
participant "SuperviseurController" as SupController
participant "ReclamationService" as Service
database "PostgreSQL" as DB

Agent -> Frontend : Soumet geste commercial / dérogation (motif)
Frontend -> RecController : POST /api/reclamations/{id}/demander-validation-superviseur
activate RecController

RecController -> Service : demanderValidationSuperviseur(id, motif)
activate Service
Service -> DB : update Reclamation\n[Statut = 'EN_ATTENTE_SUPERVISEUR']
Service --> RecController : OK
deactivate Service
RecController --> Frontend : 200 OK
deactivate RecController

Superviseur -> Frontend : Consulte l'onglet "Demandes de validation"
Superviseur -> Frontend : Clique "Valider Dérogation"

Frontend -> SupController : PUT /api/superviseur/reclamations/{id}/valider-derogation
activate SupController

SupController -> Service : validerDerogationSuperviseur(id, motif)
activate Service
Service -> DB : update Reclamation\n[Statut = 'RESOLU', motifDerogation]
Service --> SupController : OK
deactivate Service

SupController --> Frontend : 200 OK (Statut RESOLU)
deactivate SupController
Frontend --> Superviseur : Dérogation validée, ticket RESOLU
@enduml
```

---

## 5. Surveillance SLA Périodique & Escalade Automatique (SlaMonitorService)

```plantuml
@startuml Sequence_SlaMonitor_Automatic

autonumber
skinparam shadowing true
skinparam backgroundColor #FFFFFF

participant "SlaMonitorService\n(@Scheduled 5 min)" as Scheduler
participant "ReclamationRepository" as Repo
participant "ReclamationService" as RecService
participant "NotificationService" as NotifService
database "PostgreSQL" as DB

Scheduler -> Repo : findByStatutNotIn(CLOTURE, RESOLU)
activate Scheduler
activate Repo
Repo --> Scheduler : Liste des réclamations actives
deactivate Repo

loop Pour chaque réclamation active
    Scheduler -> Scheduler : verifierDepassementSla(ticket)
    
    alt SLA dépassé & Aucune Escalade
        Scheduler -> RecService : creerEscaladeAutomatiqueN1(ticket)
        activate RecService
        RecService -> DB : save Escalade (N1, DEMANDE)
        RecService -> DB : update Reclamation [statut = 'ESCALADE_N1']
        RecService -> NotifService : envoyerAlerteSla(ticket, "N1 Auto")
        RecService --> Scheduler : Escalade N1 créée
        deactivate RecService
    else SLA dépassé & Escalade N1 déjà validée
        Scheduler -> RecService : creerEscaladeAutomatiqueN2(ticket)
        activate RecService
        RecService -> DB : save Escalade (N2, VALIDEE)
        RecService -> DB : update Reclamation [statut = 'ESCALADE_N2', equipe = N2]
        RecService -> NotifService : envoyerAlerteSla(ticket, "N2 Auto")
        RecService --> Scheduler : Escalade N2 créée
        deactivate RecService
    end
end
deactivate Scheduler

@enduml
```
