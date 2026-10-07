# Kossa - KOSSA Africa

**Kossa** est une application web robuste conçue pour la gestion et le suivi des réclamations clients pour KOSSA Africa. Elle permet aux agents de support de recevoir, traiter et résoudre les plaintes, tout en offrant aux managers une vue d'ensemble via des tableaux de bord et des rapports d'exportation.

## 🚀 Fonctionnalités Clés

- **Tableau de Bord Chargé de Réclamation :** Visualisation et gestion des tickets (point d'entrée unique).
- **Tableau de Bord Chef d'Agence :** Statistiques en temps réel, affectation par groupe de compétence, transmission au SISAV, gestion des escalades.
- **Tableau de Bord Superviseur d'agence :** validation des dérogations/remboursements, rejet motivé, escalade immédiate N2, supervision du périmètre (agents, équipes, indicateurs).
- **Routage par département :** les réclamations sont routées automatiquement vers l'équipe N1 de leur domaine (Mobile Money, FTTH, Internet, Facturation, Technique) avec un SLA réel par type.
- **Workflow hiérarchique N1 → N2 :** toute réclamation passe par le niveau 1 ; l'escalade est demandée par l'agent et validée par le Chef d'agence.
- **Système de Notification :** alertes pour les nouveaux tickets, changements de statut et décisions d'escalade (SMS client + email optionnel).
- **Exports de Rapports :** génération de rapports au format PDF (officiel) et CSV/Excel (données).
- **Gestion des Pièces Jointes :** support des documents justificatifs liés aux réclamations.
- **Validation stricte des formulaires :** MSISDN `+226`/8 chiffres/préfixe KOSSA, **priorité limitée à FAIBLE/MOYENNE/CRITIQUE**, email, longueurs et caractères autorisés.
- **Administration du référentiel :** CRUD complet des catégories, SLA et types de réclamation (modification et suppression, avec protection contre la suppression d'éléments encore utilisés).
- **Sécurité :** authentification par JWT et gestion des rôles (Admin, Chef d'agence, Gestionnaire, Chef SAV, Superviseur, Chargé de Réclamation).
- **Profil utilisateur :** bouton avatar dans la barre de navigation permettant d'accéder aux informations et paramètres du compte.
- **Sélecteur d'agence :** pour les rôles globaux, possibilité de sélectionner une agence spécifique depuis la barre de navigation.
- **Filtrage par agence :** chaque requête API inclut automatiquement un header `X-Agence-Id` pour filtrer les données selon l'agence de l'utilisateur connecté.

---

## 🛠️ Stack Technique

### Backend
- **Framework :** Spring Boot 4 (Java 17)
- **Base de données :** PostgreSQL
- **Sécurité :** Spring Security & JWT (JSON Web Token)
- **Génération PDF :** OpenPDF (LibrePDF)
- **Manipulation Excel :** Apache POI

### Frontend
- **Framework :** React 19 (TypeScript)
- **UI Library :** Material UI (MUI)
- **Charts :** Chart.js
- **Communication API :** Axios

---

## 📥 Installation et Configuration

### Prérequis
- **Java 17** ou supérieur installé.
- **Node.js** (v18+) et **npm** installés.
- **PostgreSQL** installé et en cours d'exécution.
- **Maven** (ou utiliser le wrapper `mvnw` inclus).

### 1. Configuration de la Base de Données
Créez une base de données PostgreSQL nommée `kossa_db`.
Mettez à jour le fichier `src/main/resources/application.properties` avec vos identifiants :
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/kossa_db
spring.datasource.username=VOTRE_UTILISATEUR
spring.datasource.password=VOTRE_MOT_DE_PASSE
```

### 2. Lancer le Backend
Depuis la racine du projet :
```bash
./mvnw clean install
./mvnw spring-boot:run
```
L'API sera disponible sur `http://localhost:8080`.

### 3. Lancer le Frontend
Naviguez dans le dossier du client :
```bash
cd kossa-client
npm install
npm start
```
L'application sera disponible sur `http://localhost:3000`.

---

## � ️ Structure du Projet

```text
kossa/
├── src/main/java/com/kossa/
│   ├── controller/   # Points d'entrée de l'API
│   ├── entity/       # Modèles de données JPA
│   ├── repository/   # Interfaces d'accès aux données
│   ├── service/      # Logique métier
│   └── security/     # Configuration JWT et Auth
├── kossa-client/
│   ├── src/
│   │   ├── components/ # Composants React (Dashboards, Login, etc.)
│   │   ├── services/   # Client API (Axios)
│   │   └── theme.ts    # Personnalisation visuelle (MUI)
│   └── public/         # Assets statiques (Logo, Index)
└── pom.xml             # Dépendances Maven
```

---

## 🔄 Workflow des réclamations (3 directives du maître de stage)

1. **Point d'entrée unique :** toutes les réclamations sont saisies par l'agent ; le Chef d'agence consulte et
   affecte aux équipes compétentes par **domaine** (Mobile Money, FTTH, Internet, Facturation, Technique).
   Une réclamation ne peut être affectée qu'à une équipe du même domaine (groupe de compétence).

2. **Gestion des niveaux :** tout passe par le niveau 1 ; l'agent demande une escalade (motif obligatoire),
   le Chef d'agence valide (et affecte l'équipe N2) ou rejette. Pas d'accès direct au niveau 2.

3. **Règles de gestion :** affectation réservée au Chef d'agence, groupage par compétence, traçabilité, et
   validation stricte des formulaires (MSISDN `+226`/8 chiffres/préfixe KOSSA, email, longueurs, caractères).
   Les dérogations et remboursements sont validés par le **Superviseur d'agence** avant clôture.

```
Création (Agent, point d'entrée) → OUVERT
  → affectation Chef d'agence (compétence/domaine) → ASSIGNE → EN_COURS
       ├─ Résolu N1 → RESOLU → CLOTURE
       ├─ Régularisation immédiate N1 → REGULARISEE → CLOTURE
       ├─ Dérogation/remboursement → EN_ATTENTE_SUPERVISEUR
       │      ├─ Validation Superviseur → RESOLU → CLOTURE
       │      └─ Rejet Superviseur → EN_COURS
       └─ Escalade N2 demandée (agent) → ESCALADE_N1
             ├─ Rejet Chef d'agence → retour EN_COURS (niveau 1)
            └─ Validation → équipe N2 → ESCALADE_N2 → RESOLU → CLOTURE
```

---

## 📊 Exportation des Rapports

- **PDF :** Un rapport formel incluant le logo KOSSA Africa, idéal pour l'archivage.
- **Excel/CSV :** Un export de données brutes optimisé pour l'analyse sous Microsoft Excel (encodage Windows-1252 pour une compatibilité maximale).

---

## 🛡️ Authentification

L'accès à l'application est protégé par JWT. Pour vous connecter, utilisez les identifiants fournis par l'administrateur système. Les rôles déterminent les fonctionnalités accessibles dans l'interface.

**Comptes de test par agence :**

- **Admin par agence (3 comptes) :** admin.ouaga@kossa.bf, admin.bobo@kossa.bf, admin.koudougou@kossa.bf
- **Chef d'agence (3 comptes) :** chefagence@kossa.bf, chefagence.bobo@kossa.bf, chefagence.koudougou@kossa.bf
- **Superviseur par agence (3 comptes) :** superviseur.ouaga@kossa.bf, superviseur.bobo@kossa.bf, superviseur.koudougou@kossa.bf

> **Note :** les comptes par agence ne voient que les données de leur agence.

---

## 📝 Auteur
Développé pour la soutenance de projet - KOSSA Africa.
