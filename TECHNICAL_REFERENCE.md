# Référence Technique Détaillée - Kossa

Ce document fournit une explication exhaustive de l'architecture, de la structure des dossiers et de la logique métier de l'application Kossa.

---

## 📂 Structure Globale du Projet

Le projet est divisé en deux parties principales :
1.  **Racine (Backend) :** Projet Spring Boot gérant l'API, la base de données et la logique métier.
2.  **`kossa-client/` (Frontend) :** Application React gérant l'interface utilisateur.

---

## 🟢 Backend : Spring Boot (Java)

### 1. `src/main/java/com/kossa/`

#### 📦 `config/`
-   **`SecurityConfig.java`** : Configure la sécurité de l'application. Définit quelles routes sont publiques (comme `/api/auth/**`) et lesquelles nécessitent une authentification. Elle configure également le filtre JWT et la gestion des permissions par rôle.
-   **`DataInitializer.java`** : S'exécute au démarrage pour créer des données par défaut si la base est vide : types de réclamation, catégories avec SLA, **10 équipes de support (N1/N2 �  Mobile Money, FTTH, Internet, Facturation, Technique)** créées idempotemment via `saveEquipeSiAbsent`, utilisateurs (admin, **24 agents** couvrant toutes les équipes N1 et N2  **au moins 2 agents par équipe N1** et **au moins 2 experts par équipe N2**, managers, superviseur) et réclamations de test.

#### 📦 `entity/` (Modèles de données JPA)
Chaque classe ici correspond à une table dans PostgreSQL.
-   **`Utilisateur.java`** : Classe de base (Admin, Chargé de Réclamation, Chef d'agence). Contient le nom, email, mot de passe (haché) et le rôle. `Client` est une entité **indépendante** (n'hérite pas de `Utilisateur`).
-   **`Reclamation.java`** : L'entité centrale. Stocke la référence, l'objet, la description, le **domaine**, le statut (OUVERT, ASSIGNE, EN_TRAITEMENT, EN_COURS, RESOLU, CLOTURE, REOUVERT, REGULARISEE, VALIDATION_SUPERVISEUR, EN_ATTENTE_SUPERVISEUR, ESCALADE_N1, ESCALADE_N2...), la priorité, et les relations vers le client, l'agent et l'équipe de support.
-   **`EquipeSupport.java`** : Équipe de support définie par **niveau** (N1/N2), **domaine** (MOBILE_MONEY, FTTH, INTERNET, FACTURATION, TECHNIQUE) et description.
-   **`Escalade.java`** : Demande d'escalade avec niveau (N1/N2), statut (DEMANDE, VALIDEE, REJETEE, EN_ATTENTE, EN_COURS, RESOLUE) et motif.
-   **`Client.java`** : Informations sur la personne qui dépose la plainte (nom, numéro de téléphone, etc.).
-   **`Notification.java`** : Enregistre les messages destinés aux utilisateurs.

#### 📦 `enums/`
- **`Domaine.java`** : `MOBILE_MONEY`, `FTTH`, `INTERNET`, `FACTURATION`, `TECHNIQUE`.
- **`StatutEscalade.java`**, **`StatutReclamation.java`**, **`Priorite.java`**, **`Role.java`**, etc. : constantes métier du workflow. `StatutReclamation` expose `estValide`, `estFermeture` (qui vérifie uniquement le statut CLOTURE) et `estOuvertOuTraitement`.

#### 📦 `repository/` (Accès aux données)
Interfaces utilisant Spring Data JPA.
-   **`ReclamationRepository.java`** : Méthodes comme `findByStatut`, `compterTicketsParAgent`, etc.
-   **`EquipeSupportRepository.java`** : `findByNiveauAndDomaine(niveau, domaine)` pour retrouver l'équipe N1/N2 d'un domaine.
-   **`AgentRepository.java`** : `findByRoleAndEquipeSupport_Niveau...` pour filtrer les agents par niveau/domaine.
-   **`EscaladeRepository.java`** : `findByStatut(...)`.

#### 📦 `service/` (Logique Métier)
-   **`ReclamationService.java`** : Création (avec `determinerDomaine(type)`  Facturation→FACTURATION, Technique→TECHNIQUE  + affectation auto de l'équipe N1), `validerMsisdn` (+226/8 chiffres/préfixe KOSSA), `validerPriorite` (uniquement FAIBLE/MOYENNE/CRITIQUE), `verifierCompetenceDomaine` (blocage affectation hors domaine), traitement, transitions de statut (`validerTransitionStatut`) et calcul du SLA (`determinerSlaHeures` : Mobile Money 12h, Facturation 48h, autres 24h).
-   **`NotificationService.java`** : Logique des notifications internes (+ emails optionnels).
-   **`EmailService.java`** : Envoi SMTP contrôlé par `app.mail.enabled` (défaut `false`).
-   **`SmsService.java`** : Envoi SMS aux clients lors des changements de statut (création, validation, clôture). Contrôlé par `app.sms.enabled` (défaut `true`).
-   **`SlaMonitorService.java`** : Vérification périodique (`@Scheduled` 5 min) des délais ; escalade automatique niveau 1 en cas de dépassement, puis niveau 2 si une escalade N1 validée existe et le ticket reste en dépassement.

#### 📦 `controller/` (Points d'entrée API)
-   **`AuthController.java`** : Gère le login et renvoie un token JWT. Expose également `GET /api/auth/me` qui retourne le profil complet de l'utilisateur connecté (nom, email, role, agence, equipeSupport, matricule, region, departement).
-   **`ReclamationController.java`** : Création (point d'entrée), mise à jour, `POST /{id}/demander-escalade` (agent → demande N2), `POST /{id}/demander-validation-superviseur` (soumission d'une dérogation/remboursement → EN_ATTENTE_SUPERVISEUR). L'affectation d'un agent via ce contrôleur est **bloquée** (réservée au Manager).
-   **`AdminUserController.java`** : CRUD des comptes (`/api/admin/users`), `GET /equipes` (liste des équipes de support), `PUT /{id}/equipe` (affectation d'un agent à une équipe  rend l'agent visible dans les listes de sélection par domaine/niveau). La création d'un CHARGE_RECLAMATION accepte un `equipeSupportId` optionnel. Les endpoints GET/POST/PUT/DELETE acceptent l'en-tête `X-Agence-Id` pour filtrer les opérations par agence (admin par agence). La méthode `updateUser()` gère la modification du mot de passe dans la même requête (via le champ `UpdateUserRequest.password`).
-   **`AdminConfigController.java`** : CRUD du référentiel  catégories (`/api/admin/config/categories`), SLA (`/api/admin/config/sla` : POST/PUT/DELETE, suppression 409 si lié à une catégorie), types de réclamation (`/api/admin/config/types-reclamation` : POST/PUT/DELETE, suppression 409 si utilisé), rôles du référentiel (`/api/admin/config/roles`).
-   **`ManagerController.java`** : Liste des tickets/agents/équipes, `PUT /{id}/assigner` (avec contrôle de compétence), `PUT /{id}/affecter-sisav` (transmission au chef SAV), `PUT /escalades/{id}/valider` et `/rejeter`, validation de résolution. `GET /agents` filtre par `domaine`/`niveau`. `listerTickets()` accepte l'en-tête `X-Agence-Id` pour filtrer les tickets par agence.
-   **`SuperviseurController.java`** : (`@PreAuthorize SUPERVISEUR`) Vue d'activité du périmètre (`GET /activite`), demandes de validation (`GET /demandes-validation`), `PUT /reclamations/{id}/valider-derogation` (→ RESOLU) et `/rejeter-derogation` (→ EN_COURS), `POST /reclamations/{id}/escalade-immediate` (créé une escalade N2 + statut ESCALADE_N2), détails agent/équipe (`GET /agent/{id}/reclamations`, `/equipe/{id}/reclamations`). Les méthodes `voirActivite()` et `demandesValidation()` acceptent l'en-tête `X-Agence-Id` pour filtrer par agence. Un superviseur voit tous les domaines de son agence.
-   **`RapportExportController.java`** : Génération de rapports PDF et CSV.

#### 📦 `security/` (Authentification)
-   **`JwtTokenProvider.java`** : Génère et vérifie les tokens JWT maison (jjwt, HS512).
-   **`JwtAuthenticationFilter.java`** : Intercepte chaque requête pour identifier l'utilisateur.
-   La configuration CORS autorise l'en-tête `X-Agence-Id` pour permettre le filtrage multi-agence depuis le frontend.
-   L'admin par agence ne peut voir/modifier que les utilisateurs de sa propre agence (isolation des données par `X-Agence-Id`).

---

## 🔵 Frontend : React (TypeScript)

### 1. `kossa-client/src/`

#### 📦 `components/` (Interface Utilisateur)
-   **`Login.tsx`** : Formulaire de connexion. Envoie les identifiants au backend et stocke le token JWT dans le `localStorage`.
-   **`App.tsx`** : Layout principal contenant un sélecteur d'agence (dropdown) dans l'AppBar pour les rôles globaux (ADMIN, CHEF_AGENCE, GESTIONNAIRE, CHEF_SAV, SUPERVISEUR). Inclut également un dialogue de profil déclenché par le clic sur l'avatar de l'utilisateur.
-   **`DashboardAgent.tsx`** : Interface des agents : création de réclamations (avec validation des formulaires  MSISDN +226/8 chiffres/préfixe KOSSA, nom, description), traitement, et **demande d'escalade N2**. Pas d'affectation côté agent (réservée au Manager).
-   **`ManagerDashboard.tsx`** : ChefAgenceDashboard (ManagerDashboard) : tableau de bord du chef d'agence avec graphiques (Chart.js) et onglets KPI / Tickets / Demandes d'Escalade / Rapports. Affectation filtrée par compétence/domaine, transmission au SISAV, validation & rejet des escalades N2.
-   **`SupervisorDashboard.tsx`** : Vue superviseur : activité du périmètre (agents, équipes cliquables → détail des réclamations), section **Demandes de validation** avec actions Valider/Rejeter/Escalade N2 (motif saisi dans un dialogue), indicateurs par statut/priorité.
-   **`AdminUserPanel.tsx`** : Création et gestion des comptes utilisateurs, avec validation des formulaires (email, mot de passe ≥ 8 caractères, nom). Le rôle SUPERVISEUR est sélectionnable. Possède un dialogue « Modifier » unifié combinant édition d'informations, changement de mot de passe, affectation d'équipe et d'agence.

#### 📦 `services/` (Communication)
-   **`api.ts`** : Configuration centrale d'Axios (baseURL `http://localhost:8080/api`). Ajoute automatiquement le token JWT dans l'en-tête et redirige vers le login en cas de `401/403`. L'intercepteur injecte l'en-tête `X-Agence-Id` (depuis `localStorage`) dans chaque requête pour scoper les appels par agence.

#### 📦 `theme.ts`
Définit l'identité visuelle de l'application en utilisant Material UI (couleurs KOSSA Africa : Bleu `#0060A8` et Orange `#F37A21`).

---

## 🔄 Flux de Données Typiques

### Cas 1  Création et affectation
1.  **Action :** un agent crée une réclamation (point d'entrée unique).
2.  **Frontend :** `DashboardAgent.tsx` appelle `POST /api/reclamations` (pré-validation des MSISDN).
3.  **Backend :** `ReclamationService` valide le MSISDN, détermine le domaine (`determinerDomaine`) et affecte automatiquement l'équipe N1 du domaine ; `NotificationService` enregistre les notifications.
4.  **Affectation :** seul le **Chef d'agence** assigne (`PUT /api/manager/reclamations/{id}/assigner`), contrôlé par `verifierCompetenceDomaine`.

### Cas 2  Escalade N1 → N2
1.  **Agent** demande une escalade : `POST /api/reclamations/{id}/demander-escalade` (motif obligatoire) → ticket `ESCALADE_N1`, escalade `DEMANDE`.
2.  **Chef d'agence** (onglet Demandes d'Escalade) :
    - **valide** : `PUT /api/manager/escalades/{id}/valider` → ticket `ESCALADE_N2` sur l'équipe N2 du domaine ;
    - **rejette** : `PUT /api/manager/escalades/{id}/rejeter` → escalade `REJETEE`, ticket retourné `EN_COURS`.

### Cas 3  Dérogation / remboursement validée par le Superviseur
1.  **Agent** soumet une demande de dérogation/remboursement : `POST /api/reclamations/{id}/demander-validation-superviseur` → ticket `EN_ATTENTE_SUPERVISEUR` + notification.
2.  **Superviseur** (SupervisorDashboard → Demandes de validation) :
    - **valide** : `PUT /api/superviseur/reclamations/{id}/valider-derogation` (motif) → ticket `RESOLU` (geste commercial accordé) ;
    - **rejette** : `PUT /api/superviseur/reclamations/{id}/rejeter-derogation` → ticket retourné `EN_COURS`.
3.  **Escalade immédiate** : `POST /api/superviseur/reclamations/{id}/escalade-immediate` → escalade N2 `EN_ATTENTE` + ticket `ESCALADE_N2`.

---

## 🛠️ Outils de Développement
-   **Postman** : pour tester les endpoints de l'API.
-   **Navigateur DevTools** : pour inspecter les requêtes réseau et le state React.
-   **Maven** : pour compiler le Java et gérer les librairies (PDF, Excel).
-   **NPM** : pour gérer les packages JavaScript et lancer le serveur de développement.
-   **JUnit / Surefire** : pour lancer les tests d'intégration backend (`mvnw test`).
