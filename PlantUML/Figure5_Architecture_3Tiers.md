# Figure 5 : Architecture globale en 3-tiers

Ce diagramme illustre l'architecture en trois-tiers du système Kossa.

## Code PlantUML

```plantuml
@startuml Diagramme_Architecture_3Tiers

skinparam shadowing true
skinparam backgroundColor #FFFFFF

skinparam rectangle {
    BackgroundColor #F8F9FA
    BorderColor #0060A8
    FontColor #0060A8
    FontSize 12
    FontName Arial
}

skinparam component {
    BackgroundColor #FFF8F0
    BorderColor #F37A21
    FontColor #0060A8
    FontSize 11
}

skinparam database {
    BackgroundColor #EBF4FA
    BorderColor #0060A8
    FontColor #0060A8
}

' --- TIER 1 : PRÉSENTATION ---
rectangle "TIER PRÉSENTATION" as Tier1 #E3F2FD {
    component "React 19\n(SPA)" as React
    component "Material UI\n(MUI)" as MUI
    component "Axios\n(Client HTTP)" as Axios
    component "Chart.js\n(Graphiques)" as Chart
}

' --- TIER 2 : APPLICATIF ---
rectangle "TIER APPLICATIF" as Tier2 #E8F5E9 {
    component "Spring Boot\n(API REST)" as Spring
    component "Spring Security\n(JWT)" as Security
    component "Contrôleurs\n(Auth, Reclamation,\nManager, Superviseur)" as Controllers
    component "Services\n(Reclamation,\nNotification, SMS)" as Services
    component "Spring Data JPA\n(Repositories)" as JPA
}

' --- TIER 3 : DONNÉES ---
rectangle "TIER DONNÉES" as Tier3 #FFF3E0 {
    database "PostgreSQL 17\n(kossa_db)" as Postgres
    component "Hibernate\n(ORM)" as Hibernate
}

' --- FLUX ---
React --> Axios : "Requêtes HTTP"
Axios --> Spring : "REST API\n(JSON + JWT)"
Spring --> Security : "Authentification"
Security --> Controllers : "Autorisation"
Controllers --> Services : "Logique métier"
Services --> JPA : "Accès données"
JPA --> Hibernate : "Mapping ORM"
Hibernate --> Postgres : "JDBC\n(HikariCP)"

' --- FLUX RETOUR ---
Postgres --> Hibernate : "Données"
Hibernate --> JPA : "Entités"
JPA --> Services : "Résultats"
Services --> Controllers : "DTOs"
Controllers --> Security : "Réponses"
Security --> Spring : "JSON"
Spring --> Axios : "200 OK\n(Response)"
Axios --> React : "State"
React --> MUI : "Rendu"
MUI --> React : "UI"

' --- LÉGENDE ---
note bottom of Tier1
  **Couche de présentation**
  Application React monopage (SPA)
  Interface utilisateur avec Material UI
  Communication via Axios (HTTP)
end note

note bottom of Tier2
  **Couche applicative**
  API REST Spring Boot
  Sécurité JWT
  Logique métier (Services)
  Accès données (JPA)
end note

note bottom of Tier3
  **Couche de données**
  Base PostgreSQL 17
  ORM Hibernate
  Connection pool HikariCP
end note

@enduml
```

## Description

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Tier Présentation** | React 19, MUI, Axios, Chart.js | Interface utilisateur (SPA) |
| **Tier Applicatif** | Spring Boot, Spring Security, JPA | API REST, logique métier, sécurité |
| **Tier Données** | PostgreSQL 17, Hibernate | Stockage et persistence des données |

**Flux de communication :**
1. **Présentation → Applicatif** : Requêtes HTTP/REST (JSON + JWT)
2. **Applicatif → Données** : Accès via JPA/Hibernate (JDBC)
3. **Données → Applicatif** : Résultats des requêtes
4. **Applicatif → Présentation** : Réponses JSON

*(Source : réalisation personnelle)*
