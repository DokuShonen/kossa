# Figure 9 : Pipeline de traitement d'une réclamation

## Description pour construction de la figure

### Structure générale
Le pipeline est représenté sous forme de **flèche horizontale** allant de gauche à droite, avec 9 étapes successives. Chaque étape est un bloc rectangulaire coloré avec une icône et un libellé.

### Les 9 étapes (de gauche à droite)

| Étape | Couleur | Icône suggérée | Libellé |
|-------|---------|----------------|---------|
| 1. Saisie | Bleu clair | Formulaire | Saisie |
| 2. Validation | Vert clair | Check | Validation |
| 3. Domaine | Orange clair | Cible | Domaine |
| 4. Équipe N1 | Bleu clair | Équipe | Équipe N1 |
| 5. SLA | Vert clair | Horloge | SLA |
| 6. Traitement | Orange clair | Outil | Traitement |
| 7. Historique | Bleu clair | Livre | Historique |
| 8. Clôture | Vert clair | Coffre | Clôture |
| 9. Statistiques | Orange clair | Graphique | Statistiques |

### Disposition
- **Forme** : flèche horizontale continue (pipeline)
- **Sens** : gauche → droite
- **Bloc** : rectangle arrondi pour chaque étape
- **Flèches** : entre chaque bloc pour montrer la progression
- **Sous-texte** : description courte sous chaque bloc

### Contenu de chaque étape

1. **Saisie** : Agent remplit le formulaire (Client, MSISDN, Type, Objet)
2. **Validation** : Contrôle format (MSISDN +226) et règles métier
3. **Domaine** : Détermination automatique (MOBILE_MONEY, FTTH, etc.) + calcul SLA
4. **Équipe N1** : Affectation à l'équipe compétente du domaine
5. **SLA** : Surveillance toutes les 5 min, escalade si dépassement
6. **Traitement** : Résolution / Régularisation / Dérogation / Escalade N2
7. **Historique** : Enregistrement de chaque action (statut, date, utilisateur)
8. **Clôture** : Validation par le Chef d'agence, notification client
9. **Statistiques** : Agrégation des données, rapports PDF/CSV

### Style suggéré
- **Fond** : blanc
- **Bordures** : bleu foncé (#0060A8)
- **Texte** : bleu foncé, gras
- **Flèches** : bleu foncé, épaisse
- **Icônes** : style flat, couleur unie

*(Source : réalisation personnelle)*
