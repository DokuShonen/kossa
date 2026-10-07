# Kossa — Gestion des réclamations clients

Application full-stack de gestion des réclamations clients ouverte (Burkina Faso).  
Projet de soutenance  Licence en Technologie du Génie Informatique.

---

## Architecture

```
kossa/                    # Backend Spring Boot
├── src/main/java/com/kossa/
│   ├── config/                    # SecurityConfig, DataInitializer
│   ├── controller/                # API REST (Auth, Reclamation, Manager, Admin, Stats)
│   ├── dto/                       # Data Transfer Objects
│   ├── entity/                    # Entités JPA
│   ├── enums/                     # Domaine, StatutEscalade, StatutReclamation...
│   ├── repository/                # Spring Data JPA
│   ├── security/                  # JWT (token + filter)
│   └── service/                   # Logique métier
├── src/main/resources/
│   └── application.properties
└── pom.xml

kossa-client/            # Frontend React
├── src/
│   ├── components/                # Login, DashboardAgent, AgentDashboard,
│   │                              # ManagerDashboard, AdminUserPanel
│   ├── services/api.ts            # Axios + intercepteur JWT
│   └── App.tsx                    # Routage par rôle
└── package.json
```

## Stack technique

| Couche       | Technologie                          | Version  |
|--------------|--------------------------------------|----------|
| Backend      | Java / Spring Boot                   | 17 / 4.0.6 |
| ORM          | Spring Data JPA / Hibernate          | -        |
| Sécurité     | Spring Security + JWT (JJWT)         | HS512    |
| Base de données | PostgreSQL                        | -        |
| Build        | Apache Maven                         | 3.9.15   |
| Frontend     | React / TypeScript                   | 19 / 4.9 |
| UI           | MUI (Material UI)                    | 9.0.1    |
| Charts       | Chart.js / react-chartjs-2           | 4.5      |
| HTTP Client  | Axios                                | 1.16     |

---

## Prérequis

- **Java 17** ou supérieur
- **Node.js 18+** et npm
- **PostgreSQL** (serveur local ou distant)
- **Maven 3.9+** (ou utiliser le wrapper `./mvnw`)

---

## Installation

### 1. Base de données PostgreSQL

Créez la base de données `kossa_db` :

```sql
CREATE DATABASE kossa_db;
```

La config par défaut dans `application.properties` :
- **Utilisateur** : `postgres`
- **Mot de passe** : `bibiche2020`
- **Port** : `5432`

> Les tables sont créées automatiquement au démarrage (`ddl-auto=update`).

---

### 2. Backend (Spring Boot)

#### Windows

```cmd
cd kossa
mvnw.cmd clean install
mvnw.cmd spring-boot:run
```

#### Linux / macOS

```bash
cd kossa
chmod +x mvnw
./mvnw clean install
./mvnw spring-boot:run
```

Le serveur démarre sur **http://localhost:8080**.

---

### 3. Frontend (React)

```bash
cd kossa/kossa-client
npm install
npm start
```

L'application frontend démarre sur **http://localhost:3000**.

---

## Utilisateurs par défaut

> Tous les mots de passe : `kossa2026` (admin général : `adminKossa2026`)

### Administrateurs

| Email | Mot de passe | Agence | Description |
|-------|-------------|--------|-------------|
| admin@kossa.bf | adminKossa2026 | **Global** | Administrateur général  accès complet |
| admin.ouaga@kossa.bf | kossa2026 | Ouaga 2000 | Admin de l'agence Ouaga |
| admin.bobo@kossa.bf | kossa2026 | Bobo Dioulasso | Admin de l'agence Bobo |
| admin.koudougou@kossa.bf | kossa2026 | Koudougou | Admin de l'agence Koudougou |

### Chefs d'agence

| Email | Mot de passe | Agence | Description |
|-------|-------------|--------|-------------|
| chefagence@kossa.bf | kossa2026 | Ouaga 2000 | Chef d'agence Ouaga |
| chefagence2@kossa.bf | kossa2026 | Bobo Dioulasso | Chef d'agence Bobo |
| chefagence3@kossa.bf | kossa2026 | Koudougou | Chef d'agence Koudougou |

### Superviseurs

| Email | Mot de passe | Agence | Description |
|-------|-------------|--------|-------------|
| superviseur@kossa.bf | kossa2026 | **Global** | Validation dérogations/remboursements global |
| superviseur.ouaga@kossa.bf | kossa2026 | Ouaga 2000 | Superviseur de l'agence Ouaga |
| superviseur.bobo@kossa.bf | kossa2026 | Bobo Dioulasso | Superviseur de l'agence Bobo |
| superviseur.koudougou@kossa.bf | kossa2026 | Koudougou | Superviseur de l'agence Koudougou |

### Chargés de réclamation

| Email | Mot de passe | Agence | Matricule |
|-------|-------------|--------|-----------|
| charge1@kossa.bf | kossa2026 | Ouaga 2000 | CRG-OUA |
| charge2@kossa.bf | kossa2026 | Bobo Dioulasso | CRG-BDO |
| charge3@kossa.bf | kossa2026 | Koudougou | CRG-KOU |

### Gestionnaire & Chef SISAV

| Email | Mot de passe | Rôle | Description |
|-------|-------------|------|-------------|
| gestionnaire@kossa.bf | kossa2026 | Gestionnaire | Gestion centralisée des réclamations |
| chefsisav.ouaga@kossa.bf | kossa2026 | Chef SISAV | Supervision SISAV agence Ouaga 2000 |
| chefsisav.bobo@kossa.bf | kossa2026 | Chef SISAV | Supervision SISAV agence Bobo Dioulasso |
| chefsisav.koudougou@kossa.bf | kossa2026 | Chef SISAV | Supervision SISAV agence Koudougou |

### Agents SAV  par agence

#### Agence Ouaga 2000 (8 agents)

| Email | Nom | Équipe (Domaine Niveau) | Matricule |
|-------|-----|------------------------|-----------|
| agent@kossa.bf | Agent Savy | Mobile Money N1 | AGT-001 |
| agent5@kossa.bf | Binta Sawadogo | Mobile Money N2 | AGT-005 |
| agent9@kossa.bf | Nadia Koné | Facturation N1 | AGT-009 |
| agent11@kossa.bf | Esther Compaoré | Technique N1 | AGT-011 |
| agent13@kossa.bf | Rokia Nikiéma | Mobile Money N2 | AGT-013 |
| agent18@kossa.bf | Ibrahim Sana | Mobile Money N2 | AGT-018 |
| agent19@kossa.bf | Aïcha Compaoré | Mobile Money N1 | AGT-019 |
| agent22@kossa.bf | Céline Sanogo | Internet N1 | AGT-022 |

#### Agence Bobo Dioulasso (8 agents)

| Email | Nom | Équipe (Domaine Niveau) | Matricule |
|-------|-----|------------------------|-----------|
| agent2@kossa.bf | Awa Diallo | Mobile Money N1 | AGT-002 |
| agent3@kossa.bf | Issa Kaboré | FTTH N1 | AGT-003 |
| agent7@kossa.bf | Aminata Zongo | Internet N2 | AGT-007 |
| agent8@kossa.bf | Brahima Cissé | Mobile Money N2 | AGT-008 |
| agent10@kossa.bf | Oumar Thiombiano | Facturation N2 | AGT-010 |
| agent12@kossa.bf | Yacouba Sanou | Technique N2 | AGT-012 |
| agent15@kossa.bf | Delphine Kaboré | Internet N2 | AGT-015 |
| agent20@kossa.bf | Jean-Baptiste Nikiéma | Mobile Money N1 | AGT-020 |

#### Agence Koudougou (8 agents)

| Email | Nom | Équipe (Domaine Niveau) | Matricule |
|-------|-----|------------------------|-----------|
| agent4@kossa.bf | Fatoumata Traoré | Internet N1 | AGT-004 |
| agent6@kossa.bf | Salif Ouattara | FTTH N2 | AGT-006 |
| agent14@kossa.bf | Paul Zoungrana | FTTH N2 | AGT-014 |
| agent16@kossa.bf | Moussa Boly | Facturation N2 | AGT-016 |
| agent17@kossa.bf | Awa Drabo | Technique N2 | AGT-017 |
| agent21@kossa.bf | Salam Ouédraogo | FTTH N1 | AGT-021 |
| agent23@kossa.bf | Hamidou Diallo | Facturation N1 | AGT-023 |
| agent24@kossa.bf | Gérard Kaboré | Technique N1 | AGT-024 |

> **Total : 42 comptes** (1 admin général + 3 admin agence + 1 superviseur global + 3 superviseur agence + 3 chefs d'agence + 3 chargés + 1 gestionnaire + 3 chefs SISAV + 24 agents)

### Répartition par domaine (équipes de support)

| Domaine | Équipe N1 | Équipe N2 |
|---|---|---|
| Mobile Money | agent, agent2, agent19, agent20 | agent5, agent8, agent13, agent18 |
| FTTH | agent3, agent21 | agent6, agent14 |
| Internet | agent4, agent22 | agent7, agent15 |
| Facturation | agent9, agent23 | agent10, agent16 |
| Technique | agent11, agent24 | agent12, agent17 |

> Les comptes par agence (admin, superviseur, chef d'agence) ne voient et ne gèrent que les données de leur agence.
> L'admin général et les superviseurs globaux peuvent sélectionner une agence dans la barre de navigation pour filtrer les données.

---

## Comptes de démonstration

4 réclamations de test sont insérées automatiquement au premier démarrage :

| Référence | Client | Type | Priorité | Description |
|-----------|--------|------|----------|-------------|
| KOSSA-...  | TRAORE Souleymane (70000001) | Technique | CRITIQUE | Problème connexion 4G zone rurale |
| KOSSA-...  | OUEDRAOGO Awa (70000002) | Facturation | MOYENNE | Double facturation forfait mensuel |
| KOSSA-...  | KABORE Issa (70000003) | Mobile Money | CRITIQUE | Échec transfert Mobile Money |
| KOSSA-...  | DIALLO Moussa (70000004) | Technique | FAIBLE | Activer service roaming |

---

## Workflow des réclamations

Toute réclamation suit un processus **hiérarchique** avec un **point d'entrée unique** (l'agent SAV) :

```
Point d'entrée unique (Agent)
        │  Création (msisdn +226 / 8 chiffres / préfixe KOSSA,
        │  détermination du domaine, affectation auto équipe N1)
        ▼
Statut = OUVERT  ────────────────►  Affectation par le Chef d'agence SEUL
        │                           (respect du groupe de compétence = domaine)
        ▼
Statut = ASSIGNE / EN_COURS
        │
        ├─ Résolu au niveau 1  ►  RESOLU → CLOTURE
        │
        ├─ Régularisation immédiate N1  ►  REGULARISEE → CLOTURE
        │
        ├─ Dérogation / remboursement  ►  soumission au Superviseur (EN_ATTENTE_SUPERVISEUR)
        │        ├─ Validation Superviseur  ►  RESOLU → CLOTURE (geste commercial accordé)
        │        └─ Rejet Superviseur  ►  retour EN_COURS
        │
        └─ Demande d'escalade N2 (agent, motif obligatoire)
                │  Statut ticket = ESCALADE_N1
                ▼
        Décision du Chef d'agence (validation / rejet)
                ├─ Rejet ──►  ticket retourné EN_COURS (niveau 1), escalade REJETEE
                └─ Validation ──►  affectation équipe N2 du même domaine
                        Statut ticket = ESCALADE_N2 → RESOLU → CLOTURE

Superviseur d'agence (ROLE_SUPERVISEUR)
        ├─ Consulte l'activité (agents, équipes, demandes) du périmètre
        ├─ Valide ou rejette les dérogations / remboursements
        └─ Escalade immédiate vers l'équipe N2 (motif)  ►  ESCALADE_N2
```

> **Superviseur d'agence** : il voit et traite les
> réclamations de **tous les domaines** de son agence (Mobile Money, FTTH, Internet, Facturation, Technique).

### Les 3 directives du maître de stage

1. **Point d'entrée unique** : toutes les réclamations sont saisies par l'agent d'accueil ; le Chef d'agence consulte et affecte aux équipes compétentes par **domaine** (Mobile Money, FTTH, Internet, Facturation, Technique). Une réclamation ne peut être affectée qu'à une équipe du même domaine.
2. **Gestion des niveaux** : tout passe par le niveau 1 ; une escalade est demandée par l'agent, **validée par le Chef d'agence**, puis affectée à l'équipe niveau 2. Pas d'accès direct au N2.
3. **Règles métier & validation** : point d'entrée unique, groupage par compétence, traçabilité email, validation stricte des formulaires (+226, 8 chiffres, préfixes KOSSA, email, longueurs, caractères autorisés).

### Validation des formulaires (Point 3)

- **MSISDN** : indicatif `+226` (+ `00226` ou `226` facultatifs) suivi de **8 chiffres**, préfixe opérateur autorisé (`01`, `02`, `03`, `60`, `61`, `62`, `63`, `70`, `71`, `72`, `73`).
- **Priorité** : uniquement `FAIBLE`, `MOYENNE` ou `CRITIQUE` (toute autre valeur est refusée à la création et à la modification).
- **nom/prénom** : 2 à 60 caractères, lettres/espaces/`'-`.
- **description** : 10 à 2000 caractères, caractères autorisés.
- **email** : format valide ; **mot de passe** : 8 caractères minimum.

---

## API REST

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| POST | `/api/auth/login` | Public | Authentification, retourne JWT |
| GET | `/api/reclamations` | CHARGE_RECLAMATION/CHEF_AGENCE/ADMIN | Liste des réclamations |
| GET | `/api/reclamations/{id}` | CHARGE_RECLAMATION/CHEF_AGENCE/ADMIN | Détail d'une réclamation |
| POST | `/api/reclamations` | CHARGE_RECLAMATION/CHEF_AGENCE/ADMIN | Créer une réclamation (point d'entrée unique) |
| PUT | `/api/reclamations/{id}/statut` | CHARGE_RECLAMATION/CHEF_AGENCE/ADMIN | Mettre à jour le statut (l'affectation agent est bloquée) |
| POST | `/api/reclamations/{id}/demander-escalade` | CHARGE_RECLAMATION | Demander une escalade N2 (motif obligatoire) |
| GET | `/api/stats/agent` | CHARGE_RECLAMATION | Statistiques personnelles |
| GET | `/api/stats/global` | CHEF_AGENCE | Statistiques globales |
| GET | `/api/stats/periode` | CHARGE_RECLAMATION/CHEF_AGENCE | Rapport par période |
| GET | `/api/admin/users` | ADMIN | Liste des utilisateurs |
| POST | `/api/admin/users` | ADMIN | Créer un utilisateur (avec `equipeSupportId` pour un CHARGE_RECLAMATION) |
| GET | `/api/admin/users/equipes` | ADMIN | Liste des équipes de support (domaine + niveau) |
| PUT | `/api/admin/users/{id}/equipe` | ADMIN | Affecter une équipe de support à un agent |
| DELETE | `/api/admin/users/{id}` | ADMIN | Supprimer un utilisateur |
| GET | `/api/admin/config/sla` | ADMIN | Lister les SLA |
| POST | `/api/admin/config/sla` | ADMIN | Créer un SLA |
| PUT | `/api/admin/config/sla/{id}` | ADMIN | Modifier un SLA |
| DELETE | `/api/admin/config/sla/{id}` | ADMIN | Supprimer un SLA (409 si lié à une catégorie) |
| GET | `/api/admin/config/types-reclamation` | ADMIN | Lister les types de réclamation |
| POST | `/api/admin/config/types-reclamation` | ADMIN | Créer un type |
| PUT | `/api/admin/config/types-reclamation/{id}` | ADMIN | Modifier un type |
| DELETE | `/api/admin/config/types-reclamation/{id}` | ADMIN | Supprimer un type (409 si utilisé par des réclamations) |
| GET | `/api/manager/reclamations` | CHEF_AGENCE | Liste des tickets |
| PUT | `/api/manager/reclamations/{id}/assigner` | CHEF_AGENCE | Affecter un agent (contrôle de compétence/domaine) |
| PUT | `/api/manager/reclamations/{id}/valider` | CHEF_AGENCE | Valider la résolution |
| PUT | `/api/manager/reclamations/{id}/cloturer` | CHEF_AGENCE | Clôturer le dossier |
| GET | `/api/manager/agents` | CHEF_AGENCE | Agents (filtrables par domaine/niveau) |
| GET | `/api/manager/equipes` | CHEF_AGENCE | Équipes de support (N1/N2 par domaine) |
| GET | `/api/manager/escalades/enrichies` | CHEF_AGENCE | Demandes d'escalade (statut DEMANDE/VALIDEE/REJETEE...) |
| PUT | `/api/manager/escalades/{id}/valider` | CHEF_AGENCE | Valider une escalade (affecte l'équipe N2) |
| PUT | `/api/manager/escalades/{id}/rejeter` | CHEF_AGENCE | Rejeter une demande d'escalade |
| POST | `/api/reclamations/{id}/demander-validation-superviseur` | CHARGE_RECLAMATION/CHEF_AGENCE | Soumettre une dérogation/remboursement au superviseur (→ EN_ATTENTE_SUPERVISEUR) |
| GET | `/api/superviseur/activite` | SUPERVISEUR | Activité du périmètre (agents, équipes, chefs d'agence, stats) |
| GET | `/api/superviseur/demandes-validation` | SUPERVISEUR | Demandes de dérogation/remboursement en attente |
| PUT | `/api/superviseur/reclamations/{id}/valider-derogation` | SUPERVISEUR | Valider une dérogation (→ RESOLU) |
| PUT | `/api/superviseur/reclamations/{id}/rejeter-derogation` | SUPERVISEUR | Rejeter une dérogation (→ EN_COURS) |
| POST | `/api/superviseur/reclamations/{id}/escalade-immediate` | SUPERVISEUR | Escalade immédiate vers l'équipe N2 (→ ESCALADE_N2) |
| GET | `/api/superviseur/agent/{id}/reclamations` | SUPERVISEUR | Détail des réclamations d'un agent du périmètre |
| GET | `/api/superviseur/equipe/{id}/reclamations` | SUPERVISEUR | Détail des réclamations d'une équipe du périmètre |
| GET | `/api/auth/me` | Tous | Profil complet de l'utilisateur connecté |
| PUT | `/api/admin/users/{id}` | ADMIN | Modifier un utilisateur (infos + équipe + agence + mot de passe) |
| GET | `/api/admin/users/agences` | ADMIN | Liste des agences disponibles |

> **Filtrage par agence** : les endpoints `GET /api/admin/users`, `GET /api/manager/reclamations`, `GET /api/superviseur/activite` et `GET /api/superviseur/demandes-validation` acceptent le header optionnel `X-Agence-Id` pour filtrer les données par agence. L'admin par agence ne voit que les données de son agence.

---

## Structure de la base de données

```
utilisateurs (id, nom, email, username, password, role)
├── agents (id, matricule, equipe_support_id)
├── managers (id)
└── administrateurs (id)

clients (id, nom, prenom, msisdn, adresse)

reclamations (id, reference, objet, description, type, domaine,
              canal, date_creation, date_echeance, statut, priorite,
              client_id, agent_id, type_reclamation_id, categorie_id, equipe_support_id)
├── commentaires (id, contenu, date_action, auteur)
├── escalades (id, niveau, statut, motif, reclamation_id, manager_id, agent_id, equipe_support_id)
├── pieces_jointes (id, nom_fichier, type)
└── plans_action (id, description, date_execution)

types_reclamation (id, nom_type, sla_id)
slas (id, temps_maximum_heures)
equipes_support (id, nom, niveau, domaine, description)
referentiels (id, type, contenu)
```

## Tests (Backend)

```cmd
mvnw test
```

Les tests d'intégration (`src/test/java/.../WorkflowReclamationIntegrationTests.java`) couvrent :
- validation du **MSISDN** (format +226, 8 chiffres, préfixe KOSSA, rejet des mauvais numéros),
- détermination du **domaine** selon le type (y compris Facturation → FACTURATION et Technique → TECHNIQUE),
- création + **affectation automatique de l'équipe N1**, échéance SLA calculée selon le type (12h/24h/48h),
- **contrôle de compétence** (refus d'un agent hors du domaine, acceptation d'un agent compétent),
- flux **d'escalade complet N1 → N2** (DEMANDE → validation → ticket ESCALADE_N2 sur équipe N2),
- **régularisation immédiate** (REGULARISEE) et **réouverture** (REOUVERT),
- soumission au **superviseur** (EN_ATTENTE_SUPERVISEUR) et **validation** (→ RESOLU).

Au total : **13 tests** (`mvnw test` → BUILD SUCCESS, 0 échec).

Les tests utilisent la base `kossa_db` ; ils sont transactionnels et ne modifient pas les données persistées.

## Notifications (Email & SMS)

Les notifications sont enregistrées en base (consultables dans l'application) ; l'envoi **email** et **SMS** est optionnel.

Pour activer l'envoi réel d'emails, positionner les variables d'environnement :

```properties
MAIL_ENABLED=true
SMTP_HOST=smtp.exemple.com
SMTP_PORT=587
SMTP_USER=votre_compte
SMTP_PASS=votre_mot_de_passe
MAIL_FROM=noreply@kossa.bf
```

Pour activer l'envoi SMS :

```properties
SMS_ENABLED=true
SMS_API_URL=https://api.sms-provider.com/send
SMS_API_KEY=votre_cle_api
SMS_SENDER=KOSSA
```

Sans configuration (défaut `app.mail.enabled=false` et `app.sms.enabled=false`), l'application fonctionne normalement sans tentative d'envoi email/SMS.

---

## Configuration

Le fichier `src/main/resources/application.properties` :

```properties
# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/kossa_db?characterEncoding=UTF-8
spring.datasource.username=postgres
spring.datasource.password=bibiche2020

# JPA
spring.jpa.hibernate.ddl-auto=update

# Serveur
server.port=8080

# JWT
jwt.secret=votre_cle_secrete_...  # Clé HS512
jwt.expiration-ms=3600000          # 1 heure

# Email (optionnel)
app.mail.enabled=false

# SMS (optionnel)
app.sms.enabled=false
```

> Toutes les valeurs ont des **défauts** et sont surchargeables via variables d'environnement (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `SMTP_HOST`, `MAIL_ENABLED`, ...).
 
---

## SLA par type de réclamation

| Type | Domaine | Délai |
|------|---------|-------|
| Mobile Money | MOBILE_MONEY | 12h |
| FTTH | FTTH | 24h |
| Internet | INTERNET | 24h |
| Technique | TECHNIQUE | 24h |
| Facturation | FACTURATION | 48h |

> Le SLA par **type** est prioritaire (cohérent avec l'affichage en agence). Si un type n'est pas reconnu,
> le SLA de la **catégorie** (par priorité) s'applique : CRITIQUE (72h), MOYENNE (240h), FAIBLE (480h).
> Le planificateur SLA (`@Scheduled` toutes les 5 min) détecte les dépassements et déclenche une escalade
> automatique niveau 1 ; si une escalade N1 a déjà été validée et que le ticket reste en dépassement,
> une escalade **N2 automatique** est créée.

---

## Diagrammes UML

Les diagrammes du projet se trouvent dans le dossier `PlantUML/` :

- `Diagramme_Classe.md`  Diagramme de classes
- `Diagramme_CasUtilisation.md`  Diagramme de cas d'utilisation
- `Diagramme_Sequence.md`  Diagramme de séquence
- `Diagramme_Activite.md`  Diagramme d'activité
- `Diagramme_Deploiement.md`  Diagramme de déploiement

Les versions Draw.io (.drawio) et les exports (PDF/PNG) sont dans la racine du projet.

---

## Auteurs

Projet réalisé dans le cadre de la Licence en Technologie du Génie Informatique  
Département HIGH-TECH  Institut Supérieur d'Informatique et de Gestion
