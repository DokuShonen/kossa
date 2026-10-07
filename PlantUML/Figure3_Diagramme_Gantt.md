# Figure 3 : Diagramme de Gantt du projet

Ce diagramme illustre le planning du projet avec les dates réelles.

## Code PlantUML

```plantuml
@startgantt
title Planning - Kossa (Avril - Août 2026)

Project starts 2026-04-27
printscale weekly zoom 2

-- Phase 1 : Stage --
[Stage - Début] starts 2026-04-27 and lasts 1 days
[Étude préliminaire et recueil des besoins] starts 2026-04-27 and lasts 26 days

-- Phase 2 : Projet --
[Projet - Début] starts 2026-05-23 and lasts 1 days
[Analyse et conception (UML)] starts 2026-05-23 and lasts 14 days
[Développement backend (Spring Boot)] starts 2026-06-06 and lasts 30 days
[Développement frontend (React)] starts 2026-06-20 and lasts 30 days

-- Phase 3 : Fin de stage --
[Stage - Fin] starts 2026-07-27 and lasts 1 days
[Tests d'intégration et corrections] starts 2026-07-20 and lasts 20 days

-- Phase 4 : Documentation --
[Documentation et rédaction] starts 2026-07-27 and lasts 27 days
[Projet - Fin] starts 2026-08-22 and lasts 1 days
[Documentation - Fin] starts 2026-08-23 and lasts 1 days

-- Dépendances --
[Analyse et conception (UML)] starts at [Étude préliminaire et recueil des besoins]'s end
[Développement backend (Spring Boot)] starts at [Analyse et conception (UML)]'s end
[Développement frontend (React)] starts at [Développement backend (Spring Boot)]'s end
[Tests d'intégration et corrections] starts at [Développement frontend (React)]'s end
[Documentation et rédaction] starts at [Stage - Fin]'s end

-- Jalons --
[soutenance] happens at [Documentation et rédaction]'s end

-- Style --
<style>
gantt {
    .bar {
        BackgroundColor #0060A8
        FontColor #FFFFFF
    }
    .milestone {
        BackgroundColor #F37A21
    }
    .phase {
        BackgroundColor #E3F2FD
    }
}
</style>

@endgantt
```

## Description

| Tâche | Dates | Durée |
|-------|-------|-------|
| **Stage** | 27 avril - 27 juillet 2026 | 3 mois |
| Étude préliminaire et recueil des besoins | 27 avril - 22 mai 2026 | 26 jours |
| **Projet** | 23 mai - 22 août 2026 | 3 mois |
| Analyse et conception (UML) | 23 mai - 5 juin 2026 | 14 jours |
| Développement backend (Spring Boot) | 6 juin - 5 juillet 2026 | 30 jours |
| Développement frontend (React) | 20 juin - 19 juillet 2026 | 30 jours |
| Tests d'intégration et corrections | 20 juillet - 8 août 2026 | 20 jours |
| **Documentation** | 27 juillet - 23 août 2026 | 27 jours |
| Soutenance | 23 août 2026 | - |

**Durée totale du stage** : 3 mois (27 avril - 27 juillet 2026)
**Durée totale du projet** : 3 mois (23 mai - 22 août 2026)
**Documentation** : 27 juillet - 23 août 2026

*(Source : réalisation personnelle)*
