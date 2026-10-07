# Diagramme de Déploiement UML - Kossa

Ce document contient le diagramme de déploiement (Deployment Diagram) du système **Kossa** (KOSSA Africa). Il décrit l'architecture matérielle et logicielle, les nœuds d'exécution, la répartition des composants entre Frontend, Backend, Base de données et services externes.

## Code PlantUML

```plantuml
@startuml Diagramme_Deploiement_Kossa

skinparam shadowing true
skinparam backgroundColor #FFFFFF

skinparam node {
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

' --- NŒUD 1 : POSTE CLIENT UTILISATEUR ---
node "Poste Client / Navigateur Web" as ClientNode {
    artifact "Single Page Application (SPA)" as SPA {
        component "React 19 (TypeScript)" as ReactApp
        component "Material UI (MUI Components)" as MUI
        component "Axios API Client\n(JWT & Header X-Agence-Id)" as AxiosClient
        component "Chart.js (Graphiques KPI)" as ChartJS
    }
}

' --- NŒUD 2 : SERVEUR WEB & INGRESS (OPTIONNEL PROD) ---
node "Serveur Ingress / Reverse Proxy (Optionnel)" as NginxNode {
    component "Nginx / HTTPS Gateway\n(TLS/SSL Termination)" as ReverseProxy
}

' --- NŒUD 3 : SERVEUR D'APPLICATION BACKEND ---
node "Serveur d'Application (JVM Java 17)" as AppServer {
    artifact "Kossa Backend (Spring Boot 4 JAR)" as BootApp {
        
        package "Layer Sécurité" {
            component "Spring Security & CORS" as Security
            component "JwtAuthenticationFilter" as JwtFilter
        }
        
        package "Layer API Controllers" {
            component "AuthController" as AuthCtrl
            component "ReclamationController" as RecCtrl
            component "ManagerController" as MgrCtrl
            component "SuperviseurController" as SupCtrl
            component "AdminUserController & Config" as AdminCtrl
            component "RapportExportController" as ExportCtrl
        }
        
        package "Layer Service (Business)" {
            component "ReclamationService" as RecService
            component "NotificationService" as NotifService
            component "SlaMonitorService (@Scheduled)" as SlaService
            component "EmailService" as MailService
        }

        package "Layer Libs & Frameworks" {
            component "Spring Data JPA / Hibernate" as JPA
            component "OpenPDF (Génération PDF)" as OpenPDF
            component "Apache POI (Export Excel)" as POI
        }
    }
}

' --- NŒUD 4 : SERVEUR DE BASE DE DONNÉES ---
node "Serveur Base de Données (PostgreSQL 15+)" as DBNode {
    database "kossa_db" as PostgresDB {
        frame "Tables" {
            [utilisateurs / agents / managers / superviseurs]
            [agences / equipes_support]
            [reclamations / escalades / clients]
            [notifications / commentaires / pieces_jointes]
            [categories / types_reclamation / sla]
        }
    }
}

' --- NŒUD 5 : SERVEUR MAIL EXTERNE ---
node "Serveur SMTP Kossa" as MailServer {
    component "Service Email SMTP\n(Port 25 / 587)" as SMTP
}

' --- RELATIONS & PROTOCOLES ---
ClientNode -- ReverseProxy : "HTTP/HTTPS (Port 80/443)"
ReverseProxy -- AppServer : "HTTP Proxy (Port 8080)"
AxiosClient ..> JwtFilter : "REST API Calls\n(JSON, Header X-Agence-Id)"

JwtFilter --> Security
Security --> AuthCtrl
Security --> RecCtrl
Security --> MgrCtrl
Security --> SupCtrl
Security --> AdminCtrl
Security --> ExportCtrl

RecCtrl --> RecService
MgrCtrl --> RecService
SupCtrl --> RecService
AdminCtrl --> RecService
ExportCtrl --> OpenPDF
ExportCtrl --> POI

RecService --> JPA
NotifService --> JPA
SlaService --> RecService
RecService --> NotifService

JPA -- PostgresDB : "JDBC Connection Pool (HikariCP / Port 5432)"
MailService -- SMTP : "Protocol SMTP (app.mail.enabled=true)"

@enduml
```
