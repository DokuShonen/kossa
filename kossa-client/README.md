# Kossa  Frontend React

Application frontend du système de gestion des réclamations **KOSSA** (Burkina Faso).

Interface web développée avec **React 19 + TypeScript + Material UI (MUI 9)**.

## Scripts disponibles

Dans le répertoire du projet (`kossa-client/`) :

### `npm start`

Lance l'application en mode développement.\
Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

La page se recharge automatiquement à chaque modification. Les erreurs de lint sont affichées dans la console.

### `npm test`

Lance le test runner en mode interactif (watch).\
Voir [running tests](https://facebook.github.io/create-react-app/docs/running-tests).

### `npm run build`

Génère la version de production dans le dossier `build`.\
Le bundle est optimisé (minifié, fichiers hashés) et prêt à être déployé.

### `npm run eject`

**Note : opération irréversible.** Retire la dépendance de build unique de Create React App et copie
tous les fichiers de configuration (webpack, Babel, ESLint, etc.) dans le projet.

## Structure

```
src/
├── components/              # Login, DashboardAgent, AgentDashboard,
│                            # ManagerDashboard, SupervisorDashboard,
│                            # AdminUserPanel, RolesPanel, NotificationsPopover
├── services/api.ts          # Client Axios (baseURL http://localhost:8080/api) + intercepteur JWT
└── App.tsx                  # Routage par rôle (ADMIN / MANAGER / AGENT / SUPERVISEUR)
```

## Connexion au backend

L'API est appelée directement sur `http://localhost:8080/api` (surchargeable via `REACT_APP_API_URL`).
Le token JWT est injecté automatiquement dans chaque requête depuis `localStorage` ; en cas de réponse
`401/403`, l'utilisateur est redirigé vers l'écran de connexion.

## Rôles et écrans

| Rôle    | Écran principal                            | Actions clés                                             |
|---------|--------------------------------------------|----------------------------------------------------------|
| Agent   | DashboardAgent                             | Création (point d'entrée unique), traitement, régularisation immédiate, demande d'escalade N2, soumission dérogation au superviseur |
| Manager | ManagerDashboard (KPI, Tickets, Escalades, Rapports) | Affectation (compétence/domaine), validation/rejet d'escalade, rapports |
| Superviseur | SupervisorDashboard (activité, demandes de validation) | Valider/rejeter dérogations & remboursements, escalade immédiate N2, détail agent/équipe |
| Admin   | AdminUserPanel + AdminConfigPanel          | Gestion des comptes (création, mot de passe, révocation) + **affectation d'une équipe de support** (domaine/niveau) à la création et pour les agents existants ; CRUD des catégories, SLA et types de réclamation |

## Comptes de démonstration

| Email             | Mot de passe | Rôle                                   |
|-------------------|--------------|----------------------------------------|
| admin@kossa.bf     | adminKossa2026 | Administrateur                        |
| agent@kossa.bf     | kossa2026     | Agent SAV (Général N1)                 |
| agent2@kossa.bf    | kossa2026     | Agent SAV (Mobile Money N1)            |
| agent3@kossa.bf    | kossa2026     | Agent SAV (FTTH N1)                    |
| agent4@kossa.bf    | kossa2026     | Agent SAV (Internet N1)                |
| agent5@kossa.bf    | kossa2026     | Agent SAV (Mobile Money N2)            |
| agent6@kossa.bf    | kossa2026     | Agent SAV (FTTH N2)                    |
| agent7@kossa.bf    | kossa2026     | Agent SAV (Internet N2)                |
| agent7@kossa.bf    | kossa2026     | Agent SAV (Général N2)                 |
| agent10@kossa.bf   | kossa2026     | Agent SAV (Facturation N2)             |
| agent9@kossa.bf    | kossa2026     | Agent SAV (Facturation N1)             |
| agent10@kossa.bf   | kossa2026     | Agent SAV (Facturation N2)             |
| agent11@kossa.bf   | kossa2026     | Agent SAV (Technique N1)               |
| agent12@kossa.bf   | kossa2026     | Agent SAV (Technique N2)               |
| agent13@kossa.bf   | kossa2026     | Agent SAV (Mobile Money N2)            |
| agent14@kossa.bf   | kossa2026     | Agent SAV (FTTH N2)                    |
| agent15@kossa.bf   | kossa2026     | Agent SAV (Internet N2)                |
| agent16@kossa.bf   | kossa2026     | Agent SAV (Facturation N2)             |
| agent17@kossa.bf   | kossa2026     | Agent SAV (Technique N2)               |
| agent18@kossa.bf   | kossa2026     | Agent SAV (Général N2)                 |
| agent19@kossa.bf   | kossa2026     | Agent SAV (Général N1)                 |
| agent20@kossa.bf   | kossa2026     | Agent SAV (Mobile Money N1)            |
| agent21@kossa.bf   | kossa2026     | Agent SAV (FTTH N1)                    |
| agent22@kossa.bf   | kossa2026     | Agent SAV (Internet N1)                |
| agent23@kossa.bf   | kossa2026     | Agent SAV (Facturation N1)             |
| agent24@kossa.bf   | kossa2026     | Agent SAV (Technique N1)               |
| manager@kossa.bf   | kossa2026     | Manager (supervision, escalades)       |
| superviseur@kossa.bf | 
| Superviseur d'agence (dérogations, escalade immédiate) |

> 24 agents SAV au total (`agent@kossa.bf` … `agent24@kossa.bf`, mot de passe `kossa2026`) : 2 agents N1
> et 2-3 experts N2 par domaine (choix multiple pour le Manager à l'affectation).

> Voir le `README.md` à la racine du projet pour la configuration complète (backend, base de données, email).
