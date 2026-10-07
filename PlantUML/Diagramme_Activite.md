# Diagramme d'Activité UML - Cycle de Vie d'une Réclamation

Ce document contient le diagramme d'activité UML modélisant le cycle de vie complet d'une réclamation au sein du système **Kossa** (KOSSA Africa), incluant la saisie, la validation de formulaire, le routage par domaine, l'affectation par le Manager, les branches de traitement (Résolution, Dérogation Superviseur, Escalade N2) et le contrôle SLA automatique.

## Code PlantUML

```plantuml
@startuml Diagramme_Activite_Kossa

skinparam shadowing true
skinparam backgroundColor #FFFFFF

skinparam activity {
    BackgroundColor #F8F9FA
    BorderColor #0060A8
    BarColor #0060A8
    StartColor #0060A8
    EndColor #F37A21
    FontColor #0060A8
    FontSize 11
    FontName Arial
}

skinparam decision {
    BackgroundColor #FFF8F0
    BorderColor #F37A21
    FontColor #0060A8
    FontSize 11
}

start

:Le Client dépose une plainte (Agence / Téléphone);

:L'Agent de Support ouvre l'interface de saisie (DashboardAgent);

:Saisie des informations (Client, MSISDN, Type, Objet, Description);

if (MSISDN valide (+226 / 8 chiffres KOSSA) ?) then (non)
  :Afficher message d'erreur MSISDN;
  stop
else (oui)
  :Déterminer automatiquement le Domaine (determinerDomaine);
  :Calculer l'échéance SLA (Mobile Money 12h, Facturation 48h, Autres 24h);
  :Affecter l'Équipe Support Niveau 1 (N1) du Domaine;
  :Enregistrer la Réclamation (Statut: OUVERT, Réf: KOSSA-XXXX);
  :Générer Notification d'ouverture;
endif

:Le Chef d'agence consulte le tableau de bord;
:Sélectionner la réclamation & choisir un agent N1 du domaine;

if (Agent compétent dans le Domaine ?) then (non)
  :Bloquer l'assignation (Erreur de compétence);
  stop
else (oui)
  :Assigner le ticket à l'Agent (Statut: ASSIGNE);
endif

:L'Agent N1 prend en charge la réclamation (Statut: EN_TRAITEMENT / EN_COURS);

fork
  ' --- BRANCHE PRINCIPALE DE TRAITEMENT ---
  repeat
    :Analyse et investigation du problème;
    
    if (Nature du traitement ?) then (Résolution Standard N1)
      :Appliquer la solution technique ou commerciale N1;
      :Renseigner le formulaire de résolution (TicketResolution);
      :Passer la réclamation au statut RESOLU;
      break
    
    elseif (Régularisation Immédiate) then
      :Procéder à la régularisation directe;
      :Passer la réclamation au statut REGULARISEE;
      break

    elseif (Dérogation / Remboursement requis) then
      :Soumettre la demande de validation au Superviseur;
      :Passer au statut EN_ATTENTE_SUPERVISEUR;
      
      :Le Superviseur examine le dossier;
      if (Superviseur valide la dérogation ?) then (oui)
        :Accorder le geste commercial / remboursement;
        :Passer la réclamation au statut RESOLU;
        break
      else (non)
        :Rejeter la demande avec motif;
        :Retourner le ticket au statut EN_COURS;
      endif

    elseif (Problème complexe exigeant expertise N2) then
      :Saisir le motif d'escalade N2;
      :Passer la réclamation au statut ESCALADE_N1;
      
      :Le Chef d'agence examine la demande d'escalade;
      if (Chef d'agence valide l'escalade ?) then (oui)
        :Transférer à l'Équipe Support Niveau 2 (N2) du domaine;
        :Passer la réclamation au statut ESCALADE_N2;
        :L'Expert N2 traite le dossier et résout la plainte;
        :Passer la réclamation au statut RESOLU;
        break
      else (non)
        :Rejeter l'escalade avec motif;
        :Retourner la réclamation à l'Agent N1 (Statut: EN_COURS);
      endif
    endif
  repeat while (Ticket toujours en cours de traitement)

fork again
  ' --- BRANCHE EN PARALLÈLE : SURVEILLANCE SLA BATCH ---
  while (Réclamation non RESOLUE / CLOTURE) is (Active)
    :Attendre 5 minutes (Timer SlaMonitorScheduler);
    if (Date courante > Date Échéance SLA ?) then (Dépassement SLA)
      if (Aucune escalade en cours ?) then (Oui)
        :Générer automatiquement une Escalade N1 (Statut: ESCALADE_N1);
        :Notifier le Chef d'agence et l'Agent (Alerte Dépassement N1);
      elseif (Escalade N1 déjà validée ?) then (Oui)
        :Générer automatiquement une Escalade N2 (Statut: ESCALADE_N2);
        :Affecter l'Équipe N2 & Notifier l'Équipe N2 (Alerte Dépassement N2);
      endif
    endif
  endwhile
end fork

:Clôture de la réclamation (Statut: CLOTURE);
:Notification de clôture transmise au Client / Archive;

stop

@enduml
```
