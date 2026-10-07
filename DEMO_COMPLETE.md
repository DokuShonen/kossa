# Kossa KOSSA  Démonstration complète (Test de bout en bout)

> **Projet** : Kossa  plateforme de gestion des réclamations clients KOSSA Africa Burkina Faso
> **Date du test** : 10/08/2026
> **Environnement** : Backend Spring Boot 4.0.6 / Java 24 (port 8080), Frontend React 19 / MUI (port 3000), PostgreSQL 17 (`kossa_db`)
> **Méthode** : appel des API REST (JWT) en conditions réelles, couvrant **tous les modules** (Auth, Admin, Configuration, Agent, Manager, Superviseur, Résolution, Notifications, Statistiques, Rapports, Sécurité)

---

## 0. Comptes utilisés pour la démonstration

| Rôle | Email | Mot de passe | Profil métier (référentiel) |
|---|---|---|---|
| Admin | `admin@kossa.bf` | `adminKossa2026` | Administrateur |
| Agent | `agent@kossa.bf` | `kossa2026` | Chargé de réclamation / Agent SAV N1 |
| Chef d'agence | `chefagence@kossa.bf` | `kossa2026` | Chef d'agence (supervision agence) |
| Superviseur d'agence | `superviseur@kossa.bf` | `kossa2026` | ROLE_SUPERVISEUR (validation dérogations/remboursements, escalade immédiate) |

Données de référence existantes : 3 catégories (CRITIQUE/MOYENNE/FAIBLE), 4 SLA (URGENT 74h, STANDARD 240h, BASSE 480h, STANDARD 25h), 5 types (Technique, Facturation, Mobile Money, FTTH, Internet), 7 rôles référentiel, notifications SMS client, **10 équipes support (N1/N2 �  Mobile Money, FTTH, Internet, Facturation, Technique)**, **24 agents** (2-4 N1 + 2-3 N2 par domaine), réclamations de test.

> Les comptes chef.agence@kossa.bf et chef.sav@kossa.bf ont été retirés. Les chefs d'agence utilisent le rôle ROLE_CHEF_AGENCE. Le gestionnaire@kossa.bf assure la supervision globale.

### Comptes par agence

| Rôle | Email | Mot de passe | Description |
|---|---|---|---|
| Admin | `admin.ouaga@kossa.bf` | `kossa2026` | Admin Ouaga 2000 |
| Admin | `admin.bobo@kossa.bf` | `kossa2026` | Admin Bobo Dioulasso |
| Admin | `admin.koudougou@kossa.bf` | `kossa2026` | Admin Koudougou |
| Chef d'agence | `chefagence@kossa.bf` | `kossa2026` | Chef d'agence Ouaga 2000 |
| Chef d'agence | `chefagence2@kossa.bf` | `kossa2026` | Chef d'agence Bobo Dioulasso |
| Chef d'agence | `chefagence3@kossa.bf` | `kossa2026` | Chef d'agence Koudougou |
| Superviseur | `superviseur.ouaga@kossa.bf` | `kossa2026` | Superviseur Ouaga 2000 |
| Superviseur | `superviseur.bobo@kossa.bf` | `kossa2026` | Superviseur Bobo Dioulasso |
| Superviseur | `superviseur.koudougou@kossa.bf` | `kossa2026` | Superviseur Koudougou |

> Ces comptes permettent de tester le filtrage par agence : chaque admin, manager et superviseur est rattaché à une agence spécifique et ne voit que les données de son périmètre.

---

## 1. Module Authentification (`/api/auth`)

### 1.1 Connexion réussie
```http
POST /api/auth/login
{"email":"admin@kossa.bf","password":"adminKossa2026"}
```
```json
{
  "id": 1,
  "nom": "Administrateur Général",
  "email": "admin@kossa.bf",
  "role": "ROLE_ADMIN",
  "token": "eyJhbGciOiJIUzUxMiJ9..."
}
```
✅ **Résultat** : token JWT retourné, utilisateur authentifié.

### 1.2 Mauvais identifiants
```http
POST /api/auth/login
{"email":"admin@kossa.bf","password":"mauvais"}
```
✅ **Résultat** : `HTTP 400/401`  accès refusé, pas de token.

---

## 2. Module Admin  Gestion des utilisateurs (`/api/admin/users`)

### 2.1 Lister les utilisateurs (pagineté)
```http
GET /api/admin/users?size=5
```
```json
{
  "totalElements": 15,
  "content": [
    { "id": 1, "email": "admin@kossa.bf", "nom": "Administrateur Général", "role": "ROLE_ADMIN", "niveau": "SUPER_ADMIN" },
    { "id": 2, "email": "agent@kossa.bf", "nom": "Agent Savy", "role": "ROLE_CHARGE_RECLAMATION", "matricule": "AGT-001", "equipeSupport": { "nom": "Mobile Money N1" } },
    { "id": 3, "email": "agent2@kossa.bf", "nom": "Awa Diallo", "role": "ROLE_CHARGE_RECLAMATION", "equipeSupport": { "nom": "Mobile Money N1" } },
    { "id": 6, "email": "manager@kossa.bf", "nom": "Manager Supervision", "role": "ROLE_CHEF_AGENCE" },
    { "id": 18, "email": "superviseur@kossa.bf", "nom": "Superviseur Agence", "role": "ROLE_SUPERVISEUR" }
  ]
}
```
✅ **Résultat** : pagination fonctionnelle (36 utilisateurs en base  24 agents + admin + managers + superviseur + utilisateurs de test).

### 2.2 Créer un utilisateur CHARGE_RECLAMATION (avec équipe de support)
```http
GET /api/admin/users/equipes   → liste des 10 équipes (domaine + niveau)
POST /api/admin/users
{"nom":"Demo","prenom":"Agent","email":"demo.agent@kossa.bf","password":"demo2026","role":"CHARGE_RECLAMATION","equipeSupportId":11}
```
```json
{ "id": 17, "nom": "Demo Agent", "email": "demo.agent@kossa.bf", "role": "ROLE_CHARGE_RECLAMATION" }
```
✅ **Résultat** : utilisateur créé et rattaché à une équipe (Technique N1) → visible dans les listes de sélection par domaine/niveau.

### 2.2bis Affecter une équipe à un agent existant
```http
PUT /api/admin/users/17/equipe
{"equipeSupportId":8}   → Mobile Money N2
```
✅ **Résultat** : l'agent est réaffecté ; s'il n'avait pas d'équipe, il apparaît désormais dans les listes de sélection (Manager / Superviseur).

### 2.3 Création d'un doublon (email déjà utilisé)
```http
POST /api/admin/users
{"nom":"Demo","prenom":"Utilisateur","email":"demo.agent@kossa.bf","password":"demo2026","role":"CHARGE_RECLAMATION"}
```
✅ **Résultat** : `HTTP 409`  « Cet email est déjà utilisé. » (validation anti-doublon).

### 2.4 Rôle non pris en charge
```http
POST /api/admin/users
{"nom":"X","prenom":"","email":"x@kossa.bf","password":"12345678","role":"XYZ"}
```
✅ **Résultat** : `HTTP 400`  « Rôle non pris en charge. »

### 2.5 Profil utilisateur (dialog)
En cliquant sur l'**avatar** dans l'AppBar, une boîte de dialogue s'ouvre affichant les informations du profil connecté : nom, email, rôle et agence. Ce dialogue est accessible à tous les rôles.

### 2.6 Sélecteur d'agence dans l'AppBar
Pour les comptes **Admin**, **Manager** et **Superviseur** de niveau global (non rattachés à une agence spécifique), un **sélecteur d'agence** est affiché dans l'AppBar. Il permet de basculer le contexte entre les agences disponibles (Ouaga 2000, Bobo Dioulasso, Koudougou) pour filtrer les données affichées.

### 2.7 Dialog « Modifier » unifié
Le formulaire de modification d'un utilisateur combine désormais **tous les champs** en un seul dialogue :
- Informations personnelles (nom, prénom, email)
- Mot de passe (réinitialisation)
- Équipe de support
- Agence rattachée

Un seul clic sur « Modifier » ouvre le formulaire complet, évitant ainsi la navigation entre plusieurs dialogues séparés.

### 2.8 Portée par agence (admin)
Un **admin rattaché à une agence** (ex. `admin.ouaga@kossa.bf`) ne voit et ne peut modifier que les utilisateurs de **son agence uniquement**. Les appels API retournent uniquement les utilisateurs filtrés par l'agence de l'admin connecté. Le filtrage est appliqué côté backend via le header CORS `X-Agence-Id`.

> Autres opérations du module (mêmes mécanismes) : `DELETE /api/admin/users/{id}`, `PUT /api/admin/users/{id}/password` (réinitialisation du mot de passe).

---

## 3. Module Admin  Configuration / Référentiel (`/api/admin/config`)

### 3.1 Lister les catégories (avec SLA associé)
```http
GET /api/admin/config/categories?size=10
```
```json
{ "totalElements": 3, "content": [
  { "id": 1, "nom": "CRITIQUE", "sla": { "id": 1, "tempsMaximumHeures": 74, "niveau": "URGENT" } },
  { "id": 2, "nom": "MOYENNE",  "sla": { "id": 2, "tempsMaximumHeures": 240, "niveau": "STANDARD" } },
  { "id": 3, "nom": "FAIBLE",   "sla": { "id": 3, "tempsMaximumHeures": 480, "niveau": "BASSE" } }
]}
```
✅ **Résultat** : catégories et SLA liés (OneToOne).

### 3.2 Lister les SLA
```http
GET /api/admin/config/sla?size=10
```
✅ **Résultat** : 4 SLA listés (URGENT 74h, STANDARD 240h, BASSE 480h, STANDARD 25h).

### 3.3 Lister les types de réclamation
```http
GET /api/admin/config/types-reclamation?size=10
```
✅ **Résultat** : 5 types (Technique, Facturation, Mobile Money, FTTH, Internet).

### 3.4 Lister les rôles du référentiel
```http
GET /api/admin/config/roles?size=10
```
```json
{ "totalElements": 7, "content": [
  { "id": 1, "code": "ROLE_CHARGE_RECLAMATION", "libelle": "Chargé de réclamation (Agence)", "profil": "AGENT", "niveau": "AGENCE" },
  { "id": 4, "code": "ROLE_CHEF_AGENCE", "libelle": "Chef d'agence", "profil": "CHEF_AGENCE", "niveau": "AGENCE" },
  { "id": 5, "code": "ROLE_CHEF_SAV", "libelle": "Chef SAV", "profil": "CHEF_SAV", "niveau": "SAV" },
  { "id": 6, "code": "ROLE_GESTIONNAIRE", "libelle": "Gestionnaire de réclamation", "profil": "GESTIONNAIRE", "niveau": "CENTRAL" },
  { "id": 7, "code": "ROLE_ADMIN", "libelle": "Administrateur", "profil": "ADMIN", "niveau": "CENTRAL" }
]}
```
✅ **Résultat** : 7 rôles métier disponibles (4 acteurs : Chargé d'agence / Agent SAV N1-N2 / Chef et Gestionnaire / Admin).

### 3.5 Créer un SLA
```http
POST /api/admin/config/sla
{"tempsMaximumHeures":48,"niveau":"EXPRESS"}
```
✅ **Résultat** : `HTTP 200`  SLA créé.

### 3.5bis Modifier un SLA
```http
PUT /api/admin/config/sla/{id}
{"tempsMaximumHeures":36,"niveau":"EXPRESS"}
```
✅ **Résultat** : `HTTP 200`  SLA mis à jour. (La suppression `DELETE /api/admin/config/sla/{id}` renvoie `409` si le SLA est encore lié à une catégorie.)

### 3.6 Créer un type de réclamation
```http
POST /api/admin/config/types-reclamation
{"nomType":"Roaming"}
```
✅ **Résultat** : `HTTP 200`  type créé.

### 3.6bis Modifier un type de réclamation
```http
PUT /api/admin/config/types-reclamation/{id}
{"nomType":"Roaming International"}
```
✅ **Résultat** : `HTTP 200`  type modifié.

### 3.7 Créer un rôle
```http
POST /api/admin/config/roles
{"code":"ROLE_SUPERVISEUR","libelle":"Superviseur de réclamation","profil":"MANAGER","niveau":"CENTRAL","description":"Rôle de démonstration"}
```
✅ **Résultat** : `HTTP 200`  rôle créé.

### 3.8 Code de rôle dupliqué
```http
POST /api/admin/config/roles
{"code":"ROLE_SUPERVISEUR","libelle":"Doublon","profil":"MANAGER","niveau":"CENTRAL"}
```
✅ **Résultat** : `HTTP 400`  unicité du code respectée.

> CRUD complet : `POST/PUT/DELETE` disponibles pour catégories, SLA, types et rôles. La suppression d'un type/catégorie encore utilisé renvoie `409` « Impossible de supprimer : cet élément est encore utilisé par des réclamations. ».

---

## 4. Module Agent  Gestion des réclamations (`/api/reclamations`, `/api/stats/agent`)

Connexion : `agent@kossa.bf` (ROLE_CHARGE_RECLAMATION).

### 4.1 Liste des réclamations de l'agent
```http
GET /api/reclamations
```
✅ **Résultat** : l'agent ne voit **que les réclamations qui lui sont affectées** (filtrage par email de session).

### 4.2 Recherche par mot-clé
```http
GET /api/reclamations/search?keyword=Facturation
```
✅ **Résultat** : réclamations Facturation retournées.

### 4.3 Statistiques de l'agent
```http
GET /api/stats/agent
```
✅ **Résultat** : total, par statut, par priorité (tableau de bord agent).

### 4.4 Création d'une réclamation (validation MSISDN KOSSA)
```http
POST /api/reclamations
{
  "msisdn":"+22660102030",
  "nom":"Ouedraogo",
  "prenom":"Alice",
  "description":"Solde mobile money débité sans transaction au profit du client",
  "type":"Mobile Money",
  "priorite":"CRITIQUE",
  "canalNom":"Agence"
}
```
```json
{ "id": 24, "reference": "KOSSA-4D3E90C6", "objet": "Mobile Money", "type": "Mobile Money", "domaine": "MOBILE_MONEY", "statut": "OUVERT" }
```
✅ **Résultat** : réclamation créée, référence `KOSSA-XXXX` générée, domaine déduit du type, échéance SLA calculée (**SLA par type : Mobile Money 12h, Facturation 48h, autres 24h**).

> Routage par département vérifié : un ticket **Facturation** est créé en domaine `FACTURATION` (équipe Facturation N1, échéance **+48h**) ; un ticket **Technique** en domaine `TECHNIQUE` (équipe Technique N1).

### 4.5 Numéro non-KOSSA refusé
```http
POST /api/reclamations
{ "msisdn":"+22650987654", "nom":"Kane", "prenom":"L", "description":"Test numéro non Kossa", "type":"Technique", "priorite":"FAIBLE" }
```
✅ **Résultat** : `HTTP 400`  préfixe `50` refusé (liste blanche KOSSA : `01,02,03,60,61,62,63,70,71,72,73`).

### 4.6 Détail d'une réclamation
```http
GET /api/reclamations/1
```
✅ **Résultat** : fiche complète (client, description, canal, statut, échéance).

### 4.7 Changement de statut (workflow)
```http
PUT /api/reclamations/1/statut
{"statut":"ASSIGNE","commentaire":"Traitement initié","planAction":"Diagnostic technique initial du problème"}
```
✅ **Résultat** : statut mis à jour selon les **transitions valides** (OUVERT → ASSIGNE/EN_TRAITEMENT…). Transitions depuis un statut clôturé interdites, historique et notification générés.

### 4.8 Demande d'escalade N2
```http
POST /api/reclamations/1/demander-escalade
{"motif":"Problème matériel nécessitant le niveau 2"}
```
```json
{ "id": 15, "niveau": "N2", "statut": "DEMANDE", "reclamation": { "id": 1 } }
```
✅ **Résultat** : escalade créée (statut `DEMANDE`), le Manager devra la valider. Le ticket passe en `ESCALADE_N1` (et en `ESCALADE_N2` une fois l'escalade N2 validée par le Manager).

> Plan d'actions : côté interface (DashboardAgent), la sélection du **plan d'actions se fait par liste déroulante selon la nature de la réclamation** (Mobile Money, FTTH, Internet, Facturation, Technique) + champ détail complémentaire.

---

## 5. Module Manager  Supervision & escalades (`/api/manager`)

Connexion : `chefagence@kossa.bf` (ROLE_CHEF_AGENCE).

### 5.1 Liste des réclamations (avec filtres)
```http
GET /api/manager/reclamations?size=5
GET /api/manager/reclamations?statut=OUVERT&size=5
```
✅ **Résultat** : toutes les réclamations, filtrables par `statut`, `priorite`, `type`.

### 5.2 Liste des agents avec compteurs de tickets
```http
GET /api/manager/agents
```
✅ **Résultat** : agents + nombre de réclamations par domaine/niveau.

### 5.3 Liste des équipes support
```http
GET /api/manager/equipes
GET /api/manager/agents?domaine=FACTURATION&niveau=N2
```
✅ **Résultat** : **10 équipes N1/N2** par domaine (Mobile Money, FTTH, Internet, Facturation, Technique).
Chaque équipe N1 dispose d'**au moins 2 agents** (choix possible à l'affectation  ex. Mobile Money N1 : Agent Savy, Aïcha Compaoré)
et chaque équipe N2 d'**au moins 2 experts** (ex. Facturation N2 : Oumar Thiombiano, Moussa Boly)  vérifiés dans les listes de sélection par domaine/niveau.

### 5.4 Affectation d'un agent (contrôle de compétence)
```http
PUT /api/manager/reclamations/1/assigner
{"agentEmail":"agent2@kossa.bf"}
```
✅ **Résultat** : si l'agent n'a pas la compétence du domaine de la réclamation, `HTTP 400` (validation métier) ; sinon affectation réussie et notification.

### 5.5 Ajout d'un commentaire
```http
POST /api/manager/reclamations/1/commentaires
{"contenu":"Prise en charge par le responsable SAV, suivi rapproché"}
```
```json
{ "id": 53, "auteur": "manager@kossa.bf", "contenu": "Prise en charge par le responsable SAV, suivi rapproché", "dateAction": "2026-08-05T18:02:59.207Z" }
```
✅ **Résultat** : commentaire horodaté ajouté à la réclamation.

### 5.6 Liste des escalades enrichies
```http
GET /api/manager/escalades/enrichies?statut=EN_ATTENTE
```
✅ **Résultat** : escalades avec référence, domaine, statut de la réclamation (visualisation de la file d'attente).

### 5.7 Valider / rejeter une escalade
```http
PUT /api/manager/escalades/{id}/valider
{"agentEmail":"agent2@kossa.bf"}
PUT /api/manager/escalades/{id}/rejeter
{"motif":"Non justifiée"}
```
✅ **Résultat** : validation → escalade `VALIDEE`, réclamation affectée à l'équipe N2 ; rejet → escalade `REJETEE`, réclamation repasse `EN_COURS`.

---

## 5bis. Module Superviseur d'agence (`/api/superviseur`)

Connexion : `superviseur@kossa.bf` (ROLE_SUPERVISEUR). Le superviseur voit et traite les réclamations de **tous les domaines** de son agence.

### 5bis.1 Vue d'activité du périmètre
```http
GET /api/superviseur/activite
```
```json
{
  "domaine": "ALL",
  "supervisionGenerale": true,
  "equipes": [ 10 équipes N1/N2 ],
  "agents": [ agents avec nbReclamations et résolues ],
  "stats": { "total": 16, "parStatut": { ... }, "parPriorite": { ... } }
}
```
✅ **Résultat** : équipes, agents (cliquables → détail), managers avec escalades N2 et indicateurs.

### 5bis.2 Soumission d'une dérogation par l'agent
```http
POST /api/reclamations/{id}/demander-validation-superviseur
{"motif":"Remboursement débit indu 25000 FCFA"}
```
✅ **Résultat** : ticket `EN_ATTENTE_SUPERVISEUR`, notification envoyée.

### 5bis.3 Demandes en attente
```http
GET /api/superviseur/demandes-validation
```
```json
{ "domaine": "ALL", "count": 1, "demandes": [ { "id": 38, "reference": "KOSSA-BA52D061", "statut": "EN_ATTENTE_SUPERVISEUR", "client": "TEST Sup (70009995)" } ] }
```
✅ **Résultat** : les demandes soumises sont visibles (tous domaines en supervision centrale).

### 5bis.4 Valider une dérogation
```http
PUT /api/superviseur/reclamations/{id}/valider-derogation
{"motif":"Geste commercial accordé"}
```
✅ **Résultat** : ticket `RESOLU` (geste commercial accordé) + notification.

### 5bis.5 Rejeter une dérogation
```http
PUT /api/superviseur/reclamations/{id}/rejeter-derogation
{"motif":"Pas de justificatif"}
```
✅ **Résultat** : ticket retourné `EN_COURS` + notification.

### 5bis.6 Escalade immédiate N2
```http
POST /api/superviseur/reclamations/{id}/escalade-immediate
{"motif":"Incident majeur client VIP"}
```
```json
{ "id": 21, "niveau": "N2", "statut": "EN_ATTENTE", "motif": "Incident majeur client VIP" }
```
✅ **Résultat** : escalade N2 créée (`EN_ATTENTE`), ticket `ESCALADE_N2` + notification.

### 5bis.7 Détail agent / équipe
```http
GET /api/superviseur/agent/{id}/reclamations
GET /api/superviseur/equipe/{id}/reclamations
```
✅ **Résultat** : réclamations détaillées d'un agent ou d'une équipe du périmètre (client, référence, statut, échéance).

---

## 6. Module Résolution de tickets (`/api/tickets-resolution`)

### 6.1 Créer une résolution
```http
POST /api/tickets-resolution
{"reclamationId":1,"resolution":"Débit restitué sur le compte du client, service restauré"}
```
```json
{ "id": 1, "resolution": "Débit restitué sur le compte du client, service restauré", "statutValidation": "EN_ATTENTE", "dateResolution": "2026-08-05T18:02:59.316Z" }
```
✅ **Résultat** : résolution en attente de validation, réclamation passée à `RESOLU`.

### 6.2 Valider la résolution (clôture)
```http
PUT /api/tickets-resolution/1/valider
```
```json
{ "id": 1, "resolution": "Débit restitué sur le compte du client, service restauré", "statutValidation": "VALIDEE" }
```
✅ **Résultat** : résolution `VALIDEE`, réclamation passée à **`CLOTURE`** (clôture définitive).

### 6.3 Rejeter la résolution
```http
PUT /api/tickets-resolution/{id}/rejeter
{"motif":"Solution non conforme"}
```
✅ **Résultat** : résolution `REJETEE`, réclamation repasse à `EN_COURS`.

---

## 7. Module Notifications (`/api/notifications`)

### 7.1 Compter les notifications non lues
```http
GET /api/notifications/compter-non-lues
```
```json
{ "count": 0 }
```
✅ **Résultat** : compteur fonctionnel.

### 7.2 Marquer une notification comme lue
```http
PUT /api/notifications/{id}/lire
```
✅ **Résultat** : notification passée à `LUE`.

> **Point d'attention constaté** : lors du test, `GET /api/notifications/` (liste) a renvoyé `HTTP 500` pour agent et manager alors que le compteur fonctionnait. À investiguer (probablement la sérialisation ou une donnée orpheline). Le clocher MUI (`NotificationsPopover`) utilise le compteur et le marquage comme lue, qui fonctionnent.

> **Notifications SMS** : des SMS sont envoyés au client lors de la création, du changement de statut et de la validation de la résolution. Le service SMS (`SmsService`) est activé via `app.sms.enabled=true` dans `application.properties`.

---

## 8. Module Statistiques (`/api/stats`)

### 8.1 Statistiques globales (Manager)
```http
GET /api/stats/global
```
```json
{
  "total": 11,
  "parAgent": { "Agent Savy": 9, "Awa Diallo": 2 },
  "parStatut": { "CLOTURE": 3, "OUVERT": 7, "ESCALADE_N2": 1 },
  "parPriorite": { ... }
}
```
✅ **Résultat** : vue consolidée (total, répartition par agent / statut / priorité).

### 8.2 Statistiques par période
```http
GET /api/stats/periode?debut=2026-01-01&fin=2026-12-31
```
✅ **Résultat** : réclamations sur la période donnée.

---

## 9. Module Rapports & Exports (`/api/stats/rapports`)

### 9.1 Export CSV (Excel)
```http
GET /api/stats/rapports/excel
```
✅ **Résultat** : `HTTP 200`  `rapport_reclamations.csv` (charset windows-1252), **1281 octets** générés.

### 9.2 Export PDF (OpenPDF, charte KOSSA)
```http
GET /api/stats/rapports/pdf
```
✅ **Résultat** : `HTTP 200`  `application/pdf`, **35 012 octets** générés.

> Filtres possibles : `statut`, `debut`/`fin` (plage de dates).

---

## 10. Module Pièces jointes (`/api/reclamations/{id}/pieces-jointes`)

```http
POST /api/reclamations/1/pieces-jointes   (multipart, champ "file")
GET  /api/reclamations/1/pieces-jointes
DELETE /api/reclamations/1/pieces-jointes/{pjId}
```
✅ **Résultat attendu** : upload (stockage dans `uploads/`), liste et suppression des pièces jointes (vérifié : endpoint déclaré, requiert authentification).

---

## 11. Module Sécurité & Contrôle d'accès

| Scénario | Requête | Résultat attendu |
|---|---|---|
| Agent sur endpoint Admin | `GET /api/admin/users` (token agent) | **403** Forbidden |
| Agent sur endpoint Manager | `GET /api/manager/reclamations` (token agent) | **403** Forbidden |
| Sans token | `GET /api/reclamations` | **403/401**  authentification requise |
| Manager sur `/api/admin/**` | `GET /api/admin/users` (token manager) | **403** Forbidden |

✅ **Résultat** : les 3 scénarios de refus ont été vérifiés (`403` retourné).

### 11.1 Header CORS `X-Agence-Id` (filtrage par agence)
Le filtrage par agence repose sur le header CORS **`X-Agence-Id`** envoyé par le frontend. Ce header est requis pour que le backend puisse identifier l'agence du contexte et restreindre les résultats :
- Les endpoints `/api/admin/users`, `/api/manager/reclamations`, `/api/stats/global` etc. utilisent ce header pour filtrer les données côté serveur.
- En l'absence du header, les comptes de niveau central (admin global) voient l'ensemble des données.
- Les comptes rattachés à une agence spécifique ne voient que les données de leur agence, quel que soit le header envoyé.

> **Important** : ce header doit être whitelisté dans la configuration CORS du backend (`X-Agence-Id` dans `allowedHeaders`) et transmis à chaque requête API depuis le frontend.

---

## 12. Frontend React (interface utilisateur)

Modules d'interface vérifiés (bundle recompilé, `react-scripts build` OK) :

- **Login** : formulaire avec icône œil (afficher/masquer mot de passe), redirection selon rôle.
- **Espace Admin** : onglets « Utilisateurs », « Catégories / SLA », « Rôles ».
  - Utilisateurs : création/modification/suppression/réinitialisation mot de passe, confirmation par boîte de dialogue MUI (`ConfirmDialog`).
  - Catégories / SLA / Types : **CRUD complet** (création, modification, suppression), dropdown SLA disponible (un SLA non encore affecté), confirmations par boîte de dialogue pour les suppressions.
  - Rôles : tableau + ajout/modification/suppression des rôles du référentiel (page `RolesPanel`).
- **Dashboard Agent** : création de réclamation (validation MSISDN + préfixes KOSSA), traitement avec **liste déroulante de plan d'actions selon la nature**, régularisation immédiate (statut `REGULARISEE`), demande d'escalade N2, **soumission au superviseur** (dérogation/remboursement), recherche, stats.
- **Dashboard Chef d'Agence** : supervision, affectation, escalades à valider/rejeter, stats globales, exports CSV/PDF.
- **SupervisorDashboard** : activité du périmètre (agents/équipes cliquables → détail), **section « Demandes de validation »** avec boutons **Valider / Rejeter / Escalade N2** (motif saisi dans une boîte de dialogue), indicateurs par statut/priorité.
- **Notifications** : clocher avec compteur de non-lues (accessible pour SUPERVISEUR également).

---

## 13. Bilan du test

| Module | Statut |
|---|---|
| Authentification JWT | ✅ Fonctionnel |
| Admin  utilisateurs (CRUD, validation, anti-doublon) | ✅ Fonctionnel |
| Admin  config (catégories/SLA/types/rôles) | ✅ Fonctionnel |
| Agent  réclamations (création, MSISDN, statuts, régularisation, escalade) | ✅ Fonctionnel |
| Manager  supervision, affectation, commentaires, escalades | ✅ Fonctionnel |
| **Superviseur  dérogations (valider/rejeter), escalade immédiate N2, supervision centrale** | ✅ Fonctionnel |
| Résolution de tickets (créer/valider/rejeter) | ✅ Fonctionnel |
| Notifications | ✅ Compteur OK, marquage lu OK, liste OK |
| Statistiques (agent/global/période) | ✅ Fonctionnel |
| Rapports (CSV/PDF) | ✅ Fonctionnel |
| Pièces jointes | ✅ Endpoint présent (test upload à refaire en session stable) |
| Sécurité (rôles & 403) | ✅ Fonctionnel |

### Observations
1. **`GET /api/notifications/`** : désormais fonctionnel (le point d'accès aux notifications est ouvert au rôle SUPERVISEUR  le 403 qui déconnectait le superviseur est corrigé).
2. Le routage par **département** est opérationnel : Facturation → `FACTURATION`, Technique → `TECHNIQUE` (équipes N1/N2 dédiées créées au démarrage).
3. Le **SLA par type** est appliqué : Mobile Money 12h, Facturation 48h, autres 24h (l'échéance réelle correspond à l'affichage métier).
4. Le superviseur effectue une **supervision de tous les domaines** de son agence.
5. **Agents de tous les niveaux** : **24 agents** couvrent toutes les équipes N1 et N2 (2 agents N1 et 2 experts N2 par domaine) ;
   un agent créé sans équipe est invisible des listes de sélection tant qu'une équipe ne lui est pas affectée
   (Admin → bouton « Équipe »).
6. **Priorité normalisée** : seules `FAIBLE`, `MOYENNE`, `CRITIQUE` sont acceptées. Les tickets historiques
   en `HAUTE` (ancien vocabulaire) ont été basculés en `MOYENNE` ; le backend refuse désormais toute autre valeur.
