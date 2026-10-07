package com.kossa.config;

import com.kossa.entity.*;
import com.kossa.repository.*;
import com.kossa.service.ReclamationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private CategorieRepository categorieRepository;

    @Autowired
    private TypeReclamationRepository typeReclamationRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private SuperviseurRepository superviseurRepository;

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private ReclamationService reclamationService;

    @Autowired
    private EquipeSupportRepository equipeSupportRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleReferentielRepository roleReferentielRepository;

    @Autowired
    private AgenceRepository agenceRepository;

    @Autowired
    private EscaladeRepository escaladeRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        
        // 0. Initialisation du référentiel des rôles (paramétrable par l'admin)
        if (roleReferentielRepository.count() == 0) {
            log.info("====== INITIALISATION DES RÔLES ======");
            roleReferentielRepository.save(createRole("ROLE_CHARGE_RECLAMATION", "Chargé de réclamation (Agence)", "CHARGE_RECLAMATION", "AGENCE"));
            roleReferentielRepository.save(createRole("ROLE_CHARGE_RECLAMATION_SAV_N1", "Agent Support SAV Niveau 1", "CHARGE_RECLAMATION", "N1"));
            roleReferentielRepository.save(createRole("ROLE_CHARGE_RECLAMATION_SAV_N2", "Agent Support SAV Niveau 2", "CHARGE_RECLAMATION", "N2"));
            roleReferentielRepository.save(createRole("ROLE_CHEF_AGENCE", "Chef d'agence", "CHEF_AGENCE", "AGENCE"));
            roleReferentielRepository.save(createRole("ROLE_GESTIONNAIRE", "Gestionnaire de réclamations (Global)", "GESTIONNAIRE", "CENTRAL"));
            roleReferentielRepository.save(createRole("ROLE_CHEF_SAV", "Chef SAV (Agence)", "CHEF_SAV", "AGENCE"));
            roleReferentielRepository.save(createRole("ROLE_SUPERVISEUR", "Superviseur", "SUPERVISEUR", "CENTRAL"));
            roleReferentielRepository.save(createRole("ROLE_ADMIN", "Administrateur", "ADMIN", "CENTRAL"));
        }

        // Rétrofix : migrer les profils "AGENT" vers "CHARGE_RECLAMATION"
        roleReferentielRepository.findAll().stream()
                .filter(r -> "AGENT".equals(r.getProfil()))
                .forEach(r -> {
                    r.setProfil("CHARGE_RECLAMATION");
                    roleReferentielRepository.save(r);
                    log.info("Profil migré de AGENT vers CHARGE_RECLAMATION pour {}", r.getCode());
                });

        // 1. Initialisation des types de réclamations
        if (typeReclamationRepository.count() == 0) {
            log.info("====== INITIALISATION DES TYPES DE RÉFÉRENCE ======");
            
            typeReclamationRepository.save(createType("Technique"));
            typeReclamationRepository.save(createType("Facturation"));
            typeReclamationRepository.save(createType("Mobile Money"));
            typeReclamationRepository.save(createType("FTTH"));
            typeReclamationRepository.save(createType("Internet"));
        }

        // 2. Initialisation des catégories avec SLA
        if (categorieRepository.count() == 0) {
            log.info("====== INITIALISATION DES CATÉGORIES AVEC SLA ======");
            
            Categorie critique = new Categorie();
            critique.setNom("CRITIQUE");
            critique.setDescription("Réclamation à fort impact nécessitant une résolution immédiate");
            SLA slaCritique = new SLA();
            slaCritique.setTempsMaximumHeures(72);
            slaCritique.setNiveau("URGENT");
            critique.setSla(slaCritique);
            categorieRepository.save(critique);

            Categorie moyenne = new Categorie();
            moyenne.setNom("MOYENNE");
            moyenne.setDescription("Réclamation standard avec délai de résolution modéré");
            SLA slaMoyenne = new SLA();
            slaMoyenne.setTempsMaximumHeures(240);
            slaMoyenne.setNiveau("STANDARD");
            moyenne.setSla(slaMoyenne);
            categorieRepository.save(moyenne);

            Categorie faible = new Categorie();
            faible.setNom("FAIBLE");
            faible.setDescription("Réclamation mineure sans impact critique");
            SLA slaFaible = new SLA();
            slaFaible.setTempsMaximumHeures(480);
            slaFaible.setNiveau("BASSE");
            faible.setSla(slaFaible);
            categorieRepository.save(faible);

            log.info("Catégories : CRITIQUE(72h), MOYENNE(240h), FAIBLE(480h)");
        }

        // 3. Initialisation des équipes de support par domaine (compétence) - idempotent
        if (equipeSupportRepository.count() == 0) {
            log.info("====== INITIALISATION DES ÉQUIPES DE SUPPORT PAR DOMAINE ======");
        }

        saveEquipeSiAbsent("Mobile Money N1", "N1", "MOBILE_MONEY", "Support Mobile Money niveau 1 - point d'entrée des réclamations Mobile Money");
        saveEquipeSiAbsent("Mobile Money N2", "N2", "MOBILE_MONEY", "Support expert Mobile Money - escalades techniques");
        saveEquipeSiAbsent("FTTH N1", "N1", "FTTH", "Support FTTH niveau 1 - point d'entrée des réclamations FTTH");
        saveEquipeSiAbsent("FTTH N2", "N2", "FTTH", "Support expert FTTH - escalades techniques");
        saveEquipeSiAbsent("Internet N1", "N1", "INTERNET", "Support Internet niveau 1 - point d'entrée des réclamations Internet");
        saveEquipeSiAbsent("Internet N2", "N2", "INTERNET", "Support expert Internet - escalades techniques");
        saveEquipeSiAbsent("Facturation N1", "N1", "FACTURATION", "Service Facturation niveau 1 - litiges de facturation, double facturation, prélèvements");
        saveEquipeSiAbsent("Facturation N2", "N2", "FACTURATION", "Service Facturation expert - escalades litiges facturation");
        saveEquipeSiAbsent("Technique N1", "N1", "TECHNIQUE", "Département Technique niveau 1 - pannes réseau, équipements, couverture");
        saveEquipeSiAbsent("Technique N2", "N2", "TECHNIQUE", "Département Technique expert - escalades pannes et ingénierie");

        EquipeSupport equipeMobileMoneyN1 = equipeSupportRepository.findByNiveauAndDomaine("N1", "MOBILE_MONEY").orElse(null);
        EquipeSupport equipeFTTHN1 = equipeSupportRepository.findByNiveauAndDomaine("N1", "FTTH").orElse(null);
        EquipeSupport equipeInternetN1 = equipeSupportRepository.findByNiveauAndDomaine("N1", "INTERNET").orElse(null);

        // Équipes niveau 2 + Facturation / Technique
        EquipeSupport equipeMobileMoneyN2 = equipeSupportRepository.findByNiveauAndDomaine("N2", "MOBILE_MONEY").orElse(null);
        EquipeSupport equipeFTTHN2 = equipeSupportRepository.findByNiveauAndDomaine("N2", "FTTH").orElse(null);
        EquipeSupport equipeInternetN2 = equipeSupportRepository.findByNiveauAndDomaine("N2", "INTERNET").orElse(null);
        EquipeSupport equipeFacturationN1 = equipeSupportRepository.findByNiveauAndDomaine("N1", "FACTURATION").orElse(null);
        EquipeSupport equipeFacturationN2 = equipeSupportRepository.findByNiveauAndDomaine("N2", "FACTURATION").orElse(null);
        EquipeSupport equipeTechniqueN1 = equipeSupportRepository.findByNiveauAndDomaine("N1", "TECHNIQUE").orElse(null);
        EquipeSupport equipeTechniqueN2 = equipeSupportRepository.findByNiveauAndDomaine("N2", "TECHNIQUE").orElse(null);

        // 4. Initialisation des agences
        if (agenceRepository.count() == 0) {
            log.info("====== INITIALISATION DES AGENCES ======");
            saveAgence("Agence Ouaga 2000", "Ouagadougou", "OUA-2000", "Centre");
            saveAgence("Agence Bobo Dioulasso", "Bobo-Dioulasso", "BDO-01", "Ouest");
            saveAgence("Agence Koudougou", "Koudougou", "KOU-01", "Centre-Ouest");
        }

        Agence agenceOuaga = agenceRepository.findByNom("Agence Ouaga 2000").orElse(null);
        Agence agenceBobo = agenceRepository.findByNom("Agence Bobo Dioulasso").orElse(null);
        Agence agenceKoudougou = agenceRepository.findByNom("Agence Koudougou").orElse(null);

        // Rétrofix : rattachement de chaque agence existante à sa direction régionale
        agenceRepository.findAll().stream()
                .filter(a -> a.getRegion() == null || a.getRegion().isBlank())
                .forEach(a -> {
                    String region = regionParDefaut(a);
                    a.setRegion(region);
                    agenceRepository.save(a);
                    log.info("Région attribuée à l'agence {} : {}", a.getNom(), region);
                });

        // 4bis. Initialisation des utilisateurs
        if (utilisateurRepository.findByEmail("admin@kossa.bf").isEmpty()) {
            Admin admin = new Admin();
            admin.setNom("Administrateur Général");
            admin.setEmail("admin@kossa.bf");
            admin.setUsername("admin@kossa.bf");
            admin.setPassword(passwordEncoder.encode("adminKossa2026"));
            admin.setRole("ROLE_ADMIN");
            admin.setNiveau("SUPER_ADMIN");
            utilisateurRepository.save(admin);
            log.info("Admin créé: admin@kossa.bf / adminKossa2026");
        }

        creerAdminAgenceSiAbsent("admin.ouaga@kossa.bf", "Administrateur Ouaga 2000", agenceOuaga, "ADMIN_OUAGA");
        creerAdminAgenceSiAbsent("admin.bobo@kossa.bf", "Administrateur Bobo Dioulasso", agenceBobo, "ADMIN_BOBO");
        creerAdminAgenceSiAbsent("admin.koudougou@kossa.bf", "Administrateur Koudougou", agenceKoudougou, "ADMIN_KOUDOUGOU");

        creerChargeSiAbsent("agent@kossa.bf", "Agent Savy", agenceOuaga, "AGT-001", equipeMobileMoneyN1);
        creerChargeSiAbsent("agent2@kossa.bf", "Awa Diallo", agenceBobo, "AGT-002", equipeMobileMoneyN1);
        creerChargeSiAbsent("agent3@kossa.bf", "Issa Kaboré", agenceBobo, "AGT-003", equipeFTTHN1);
        creerChargeSiAbsent("agent4@kossa.bf", "Fatoumata Traoré", agenceKoudougou, "AGT-004", equipeInternetN1);

        // --- Agents niveau 2 (support expert N2) par domaine ---
        creerChargeSiAbsent("agent5@kossa.bf", "Binta Sawadogo", agenceOuaga, "AGT-005", equipeMobileMoneyN2);
        creerChargeSiAbsent("agent6@kossa.bf", "Salif Ouattara", agenceKoudougou, "AGT-006", equipeFTTHN2);
        creerChargeSiAbsent("agent7@kossa.bf", "Aminata Zongo", agenceBobo, "AGT-007", equipeInternetN2);
        creerChargeSiAbsent("agent8@kossa.bf", "Brahima Cissé", agenceBobo, "AGT-008", equipeMobileMoneyN2);

        // --- Agents Facturation (N1 + N2) ---
        creerChargeSiAbsent("agent9@kossa.bf", "Nadia Koné", agenceOuaga, "AGT-009", equipeFacturationN1);
        creerChargeSiAbsent("agent10@kossa.bf", "Oumar Thiombiano", agenceBobo, "AGT-010", equipeFacturationN2);

        // --- Agents Technique (N1 + N2) ---
        creerChargeSiAbsent("agent11@kossa.bf", "Esther Compaoré", agenceOuaga, "AGT-011", equipeTechniqueN1);
        creerChargeSiAbsent("agent12@kossa.bf", "Yacouba Sanou", agenceBobo, "AGT-012", equipeTechniqueN2);

        // --- 2e agents niveau 2 (chaque équipe N2 a au moins deux experts) ---
        creerChargeSiAbsent("agent13@kossa.bf", "Rokia Nikiéma", agenceOuaga, "AGT-013", equipeMobileMoneyN2);
        creerChargeSiAbsent("agent14@kossa.bf", "Paul Zoungrana", agenceKoudougou, "AGT-014", equipeFTTHN2);
        creerChargeSiAbsent("agent15@kossa.bf", "Delphine Kaboré", agenceBobo, "AGT-015", equipeInternetN2);
        creerChargeSiAbsent("agent16@kossa.bf", "Moussa Boly", agenceKoudougou, "AGT-016", equipeFacturationN2);
        creerChargeSiAbsent("agent17@kossa.bf", "Awa Drabo", agenceKoudougou, "AGT-017", equipeTechniqueN2);
        creerChargeSiAbsent("agent18@kossa.bf", "Ibrahim Sana", agenceOuaga, "AGT-018", equipeMobileMoneyN2);

        // --- 2e agents niveau 1 (chaque équipe N1 a au moins deux agents pour le choix à l'assignation) ---
        creerChargeSiAbsent("agent19@kossa.bf", "Aïcha Compaoré", agenceOuaga, "AGT-019", equipeMobileMoneyN1);
        creerChargeSiAbsent("agent20@kossa.bf", "Jean-Baptiste Nikiéma", agenceBobo, "AGT-020", equipeMobileMoneyN1);
        creerChargeSiAbsent("agent21@kossa.bf", "Salam Ouédraogo", agenceKoudougou, "AGT-021", equipeFTTHN1);
        creerChargeSiAbsent("agent22@kossa.bf", "Céline Sanogo", agenceOuaga, "AGT-022", equipeInternetN1);
        creerChargeSiAbsent("agent23@kossa.bf", "Hamidou Diallo", agenceKoudougou, "AGT-023", equipeFacturationN1);
        creerChargeSiAbsent("agent24@kossa.bf", "Gérard Kaboré", agenceKoudougou, "AGT-024", equipeTechniqueN1);

        // Redistribution des agents sur les 3 agences (8 agents par agence)
        // Agence Ouaga 2000 : agent, agent5, agent9, agent11, agent13, agent18, agent19, agent22
        // Agence Bobo Dioulasso : agent2, agent3, agent7, agent8, agent10, agent12, agent15, agent20
        // Agence Koudougou : agent4, agent6, agent14, agent16, agent17, agent21, agent23, agent24
        Map<String, Agence> agenceParAgent = Map.ofEntries(
                Map.entry("agent@kossa.bf", agenceOuaga),
                Map.entry("agent2@kossa.bf", agenceBobo),
                Map.entry("agent3@kossa.bf", agenceBobo),
                Map.entry("agent4@kossa.bf", agenceKoudougou),
                Map.entry("agent5@kossa.bf", agenceOuaga),
                Map.entry("agent6@kossa.bf", agenceKoudougou),
                Map.entry("agent7@kossa.bf", agenceBobo),
                Map.entry("agent8@kossa.bf", agenceBobo),
                Map.entry("agent9@kossa.bf", agenceOuaga),
                Map.entry("agent10@kossa.bf", agenceBobo),
                Map.entry("agent11@kossa.bf", agenceOuaga),
                Map.entry("agent12@kossa.bf", agenceBobo),
                Map.entry("agent13@kossa.bf", agenceOuaga),
                Map.entry("agent14@kossa.bf", agenceKoudougou),
                Map.entry("agent15@kossa.bf", agenceBobo),
                Map.entry("agent16@kossa.bf", agenceKoudougou),
                Map.entry("agent17@kossa.bf", agenceKoudougou),
                Map.entry("agent18@kossa.bf", agenceOuaga),
                Map.entry("agent19@kossa.bf", agenceOuaga),
                Map.entry("agent20@kossa.bf", agenceBobo),
                Map.entry("agent21@kossa.bf", agenceKoudougou),
                Map.entry("agent22@kossa.bf", agenceOuaga),
                Map.entry("agent23@kossa.bf", agenceKoudougou),
                Map.entry("agent24@kossa.bf", agenceKoudougou)
        );

        // Rétrofix : affecter l'agence à tout agent dont l'agence est null ou incorrecte
        agenceParAgent.forEach((email, agenceCorrecte) -> {
            agentRepository.findByEmail(email).ifPresent(agent -> {
                if (agent.getAgence() == null || !agent.getAgence().getId().equals(agenceCorrecte.getId())) {
                    agent.setAgence(agenceCorrecte);
                    utilisateurRepository.save(agent);
                    log.info("Agent {} redistribué à l'agence {}", email, agenceCorrecte.getNom());
                }
            });
        });

        // Rétrofix : réclamations rattachées à l'agence de leur agent créateur
        // (corrige les agences après redistribution des agents)
        reclamationRepository.findAll().stream()
                .filter(r -> r.getAgent() != null && r.getAgent().getAgence() != null)
                .filter(r -> r.getAgence() == null || !r.getAgence().getId().equals(r.getAgent().getAgence().getId()))
                .forEach(r -> {
                    r.setAgence(r.getAgent().getAgence());
                    reclamationRepository.save(r);
                    log.info("Agence corrigée pour la réclamation {} -> {}", r.getReference(), r.getAgent().getAgence().getNom());
                });

        // Rétrofix : affecter equipeSupport aux chargés de réclamation qui n'en ont pas
        String[] chargeEmails = {"charge1@kossa.bf", "charge2@kossa.bf", "charge3@kossa.bf"};
        for (String email : chargeEmails) {
            agentRepository.findByEmail(email).ifPresent(agent -> {
                if (agent.getEquipeSupport() == null) {
                    agent.setEquipeSupport(equipeMobileMoneyN1);
                    utilisateurRepository.save(agent);
                    log.info("Equipe support {} affectée au chargé {}", equipeMobileMoneyN1 != null ? equipeMobileMoneyN1.getNom() : "null", email);
                }
            });
        }

        // Rétrofix : migrer les anciens ROLE_AGENT vers ROLE_CHARGE_RECLAMATION
        utilisateurRepository.findByRole("ROLE_AGENT").forEach(u -> {
            u.setRole("ROLE_CHARGE_RECLAMATION");
            utilisateurRepository.save(u);
            log.info("Agent {} migré vers ROLE_CHARGE_RECLAMATION", u.getEmail());
        });

        // Rétrofix : migration des rôles
        // 1. Ancien ROLE_MANAGER → ROLE_CHEF_AGENCE (migration depuis l'avant-dernière version)
        utilisateurRepository.findByRole("ROLE_MANAGER").forEach(u -> {
            u.setRole("ROLE_CHEF_AGENCE");
            utilisateurRepository.save(u);
            log.info("Ancien ROLE_MANAGER {} migré vers ROLE_CHEF_AGENCE", u.getEmail());
        });
        // 2. Restaurer CHEF_AGENCE local depuis CHEF_SAV (manager.ouaga/bobo/koudougou étaient CHEF_AGENCE avant)
        managerRepository.findByRole("ROLE_CHEF_SAV").forEach(u -> {
            if (u.getEmail() != null && u.getEmail().startsWith("manager.")) {
                u.setRole("ROLE_CHEF_AGENCE");
                utilisateurRepository.save(u);
                log.info("Chef SAV {} restauré en ROLE_CHEF_AGENCE", u.getEmail());
            }
        });
        // 3. CHEF_AGENCE sans agence → ROLE_GESTIONNAIRE (chef d'agence global → gestionnaire)
        utilisateurRepository.findByRole("ROLE_CHEF_AGENCE").forEach(u -> {
            if (u.getAgence() == null) {
                u.setRole("ROLE_GESTIONNAIRE");
                utilisateurRepository.save(u);
                log.info("Chef d'agence global {} migré vers ROLE_GESTIONNAIRE", u.getEmail());
            }
        });
        // 4. S'assurer que gestionnaire@kossa.bf est bien ROLE_GESTIONNAIRE
        utilisateurRepository.findByEmail("gestionnaire@kossa.bf").ifPresent(u -> {
            if (!"ROLE_GESTIONNAIRE".equals(u.getRole())) {
                u.setRole("ROLE_GESTIONNAIRE");
                utilisateurRepository.save(u);
                log.info("Compte {} rétabli en ROLE_GESTIONNAIRE", u.getEmail());
            }
        });
        // 5. S'assurer que ROLE_CHEF_AGENCE existe dans le référentiel
        if (roleReferentielRepository.findAll().stream().noneMatch(r -> "ROLE_CHEF_AGENCE".equals(r.getCode()))) {
            roleReferentielRepository.save(createRole("ROLE_CHEF_AGENCE", "Chef d'agence", "CHEF_AGENCE", "AGENCE"));
            log.info("Rôle référentiel ROLE_CHEF_AGENCE ajouté");
        }
        // 6. S'assurer que ROLE_GESTIONNAIRE existe dans le référentiel
        if (roleReferentielRepository.findAll().stream().noneMatch(r -> "ROLE_GESTIONNAIRE".equals(r.getCode()))) {
            roleReferentielRepository.save(createRole("ROLE_GESTIONNAIRE", "Gestionnaire de réclamations (Global)", "GESTIONNAIRE", "CENTRAL"));
            log.info("Rôle référentiel ROLE_GESTIONNAIRE ajouté");
        }

        // Supprimer l'ancien compte manager@kossa.bf (sans agence, redondant avec gestionnaire@kossa.bf)
        managerRepository.findByEmail("manager@kossa.bf").ifPresent(m -> {
            reclamationRepository.findByAgentEmail(m.getEmail()).forEach(r -> {
                r.setAgent(null);
                reclamationRepository.save(r);
            });
            escaladeRepository.findByManager_Id(m.getId()).forEach(e -> {
                e.setManager(null);
                escaladeRepository.save(e);
            });
            utilisateurRepository.delete(m);
            log.info("Ancien compte manager@kossa.bf supprimé (redondant avec gestionnaire@kossa.bf)");
        });

        creerManagerAgenceSiAbsent("manager.ouaga@kossa.bf", "Manager Ouaga 2000", agenceOuaga, "Support Client Ouaga");
        creerManagerAgenceSiAbsent("manager.bobo@kossa.bf", "Manager Bobo Dioulasso", agenceBobo, "Support Client Bobo");
        creerManagerAgenceSiAbsent("manager.koudougou@kossa.bf", "Manager Koudougou", agenceKoudougou, "Support Client Koudougou");

        // ---- Chefs d'agence (role CHEF_AGENCE local) ----
        creerChefAgenceSiAbsent("chefagence@kossa.bf", "Abdel Aziz Sawadogo", agenceOuaga, "Agence Ouaga 2000");
        creerChefAgenceSiAbsent("chefagence2@kossa.bf", "Clarisse Ouattara", agenceBobo, "Agence Bobo Dioulasso");
        creerChefAgenceSiAbsent("chefagence3@kossa.bf", "Marcel Zida", agenceKoudougou, "Agence Koudougou");

        // ---- Chargés de réclamation (agences) ----
        creerChargeSiAbsent("charge1@kossa.bf", "Adja Tassembedo", agenceOuaga, "CRG-OUA", equipeMobileMoneyN1);
        creerChargeSiAbsent("charge2@kossa.bf", "Rasmané Ilboudo", agenceBobo, "CRG-BDO", equipeMobileMoneyN1);
        creerChargeSiAbsent("charge3@kossa.bf", "Safi Kaboré", agenceKoudougou, "CRG-KOU", equipeMobileMoneyN1);

        // ---- Gestionnaire de réclamation (central) ----
        creerGestionnaireSiAbsent("gestionnaire@kossa.bf", "Gestionnaire Central");

        // ---- Chefs SISAV (un par agence) ----
        creerChefSisavSiAbsent("chefsisav.ouaga@kossa.bf", "Chef SISAV Ouaga", agenceOuaga, "Centre");
        creerChefSisavSiAbsent("chefsisav.bobo@kossa.bf", "Chef SISAV Bobo", agenceBobo, "Ouest");
        creerChefSisavSiAbsent("chefsisav.koudougou@kossa.bf", "Chef SISAV Koudougou", agenceKoudougou, "Centre-Ouest");

        // Rétrofix : migrer les références de l'ancien chef SISAV global vers Ouaga
        managerRepository.findByEmail("chefsisav@kossa.bf").ifPresent(old -> {
            Manager ouagaChef = managerRepository.findByEmail("chefsisav.ouaga@kossa.bf").orElse(null);
            if (ouagaChef != null) {
                reclamationRepository.findByChefSisavEmail(old.getEmail()).forEach(r -> {
                    r.setChefSisav(ouagaChef);
                    reclamationRepository.save(r);
                });
                log.info("Réclamations migrées de chefsisav@kossa.bf vers chefsisav.ouaga@kossa.bf");
                utilisateurRepository.delete(old);
                log.info("Ancien chef SISAV global supprimé: chefsisav@kossa.bf");
            }
        });

        // Rétrofix : région par défaut pour les chefs SAV existants sans région
        managerRepository.findAll().stream()
                .filter(m -> "ROLE_CHEF_SAV".equals(m.getRole()) && (m.getRegion() == null || m.getRegion().isBlank()))
                .forEach(m -> {
                    m.setRegion("Centre");
                    utilisateurRepository.save(m);
                    log.info("Région attribuée au chef SAV {} : Centre", m.getEmail());
                });

        // Rétrofix : migrer agents/charges de "Général N1/N2" vers "Mobile Money N1/N2"
        equipeSupportRepository.findByNiveauAndDomaine("N1", "MOBILE_MONEY").ifPresent(mmN1 -> {
            equipeSupportRepository.findByNom("Général N1").ifPresent(oldN1 -> {
                agentRepository.findAll().stream()
                        .filter(a -> oldN1.equals(a.getEquipeSupport()))
                        .forEach(a -> {
                            a.setEquipeSupport(mmN1);
                            agentRepository.save(a);
                            log.info("Agent {} migré de Général N1 vers Mobile Money N1", a.getEmail());
                        });
                superviseurRepository.findAll().stream()
                        .filter(s -> oldN1.equals(s.getEquipeSupervisee()))
                        .forEach(s -> {
                            s.setEquipeSupervisee(mmN1);
                            superviseurRepository.save(s);
                            log.info("Superviseur {} migré de Général N1 vers Mobile Money N1", s.getEmail());
                        });
                reclamationRepository.findByEquipeSupportId(oldN1.getId()).forEach(r -> {
                    r.setEquipeSupport(mmN1);
                    reclamationRepository.save(r);
                });
                log.info("Réclamations migrées de Général N1 vers Mobile Money N1");
            });
        });

        equipeSupportRepository.findByNiveauAndDomaine("N2", "MOBILE_MONEY").ifPresent(mmN2 -> {
            equipeSupportRepository.findByNom("Général N2").ifPresent(oldN2 -> {
                agentRepository.findAll().stream()
                        .filter(a -> oldN2.equals(a.getEquipeSupport()))
                        .forEach(a -> {
                            a.setEquipeSupport(mmN2);
                            agentRepository.save(a);
                            log.info("Agent {} migré de Général N2 vers Mobile Money N2", a.getEmail());
                        });
                reclamationRepository.findByEquipeSupportId(oldN2.getId()).forEach(r -> {
                    r.setEquipeSupport(mmN2);
                    reclamationRepository.save(r);
                });
                log.info("Réclamations migrées de Général N2 vers Mobile Money N2");
            });
        });

        // Supprimer les anciennes équipes Général
        equipeSupportRepository.findByNom("Général N1").ifPresent(e -> { equipeSupportRepository.delete(e); log.info("Équipe Général N1 supprimée"); });
        equipeSupportRepository.findByNom("Général N2").ifPresent(e -> { equipeSupportRepository.delete(e); log.info("Équipe Général N2 supprimée"); });

        // Rétrofix : migrer les réclamations de type "Général" vers "Mobile Money"
        List<Reclamation> reclamationsGenerale = reclamationRepository.findAll().stream()
                .filter(r -> "Général".equals(r.getType()))
                .toList();
        for (Reclamation r : reclamationsGenerale) {
            r.setType("Mobile Money");
            r.setDomaine("MOBILE_MONEY");
            reclamationRepository.save(r);
        }
        if (!reclamationsGenerale.isEmpty()) {
            log.info("Réclamations type 'Général' migrées vers 'Mobile Money' : {}", reclamationsGenerale.size());
        }

        if (superviseurRepository.findByEmail("superviseur@kossa.bf").isEmpty()) {
            Superviseur superviseur = new Superviseur();
            superviseur.setNom("Superviseur Général");
            superviseur.setEmail("superviseur@kossa.bf");
            superviseur.setUsername("superviseur@kossa.bf");
            superviseur.setPassword(passwordEncoder.encode("kossa2026"));
            superviseur.setRole("ROLE_SUPERVISEUR");
            superviseur.setDepartement("Supervision");
            superviseur.setEquipeSupervisee(equipeMobileMoneyN1);
            utilisateurRepository.save(superviseur);
            log.info("Superviseur global créé: superviseur@kossa.bf / kossa2026 (Général N1)");
        }

        creerSuperviseurAgenceSiAbsent("superviseur.ouaga@kossa.bf", "Superviseur Ouaga 2000", agenceOuaga, "Supervision Ouaga");
        creerSuperviseurAgenceSiAbsent("superviseur.bobo@kossa.bf", "Superviseur Bobo Dioulasso", agenceBobo, "Supervision Bobo");
        creerSuperviseurAgenceSiAbsent("superviseur.koudougou@kossa.bf", "Superviseur Koudougou", agenceKoudougou, "Supervision Koudougou");

        // 5. Insertion de réclamations de test
        boolean demoBfDejaCharge = reclamationRepository.findAll().stream()
                .anyMatch(r -> r.getDescription() != null && r.getDescription().contains("quartier Koko"));
        if (!demoBfDejaCharge) {
            log.info("====== INSERTION DES RÉCLAMATIONS DE DÉMO (Burkina Faso) ======");

            Object[][] demos = {
                {"60000001", "SANKARA", "Mariam", "Coupures fibre optique FTTH récurrentes à Bobo-Dioulasso quartier Koko.", "FTTH", "CRITIQUE", "Agence", "agent5@kossa.bf"},
                {"63000002", "ZONGO", "Rasmané", "Débit internet très faible malgré le forfait 4G à Koudougou.", "Internet", "MOYENNE", "Call Center", "agent6@kossa.bf"},
                {"73000003", "SAWADOGO", "Brigitte", "Retrait Mobile Money impossible au distributeur mais solde debité.", "Mobile Money", "CRITIQUE", "Agence", "agent7@kossa.bf"},
                {"70000005", "YAGO", "Ibrahim", "Frais inconnus prélevés sur le compte principal à Ouahigouya.", "Facturation", "MOYENNE", "Web", "agent8@kossa.bf"},
                {"62000006", "BAZE", "Fatimata", "Réception de SMS publicitaires non sollicités après résiliation d'un service.", "Technique", "FAIBLE", "App Mobile", "agent9@kossa.bf"},
                {"72000007", "COULIBALY", "Aïcha", "Ligne fixe suspendue sans préavis à Gaoua.", "Technique", "MOYENNE", "Agence", "agent10@kossa.bf"},
                {"71000008", "SOME", "Jean-Baptiste", "Transfert Orange Money vers KOSSA Money bloqué à Tenkodogo.", "Mobile Money", "MOYENNE", "Call Center", "agent11@kossa.bf"},
                {"72000009", "NIKIEMA", "Pascaline", "Ondes d'internet coupées dans le secteur 12 de Ouagadougou.", "Internet", "FAIBLE", "Réseaux Sociaux", "agent12@kossa.bf"},
            };

            for (Object[] d : demos) {
                reclamationService.creerReclamationAvecSla(
                    (String) d[0], (String) d[1], (String) d[2],
                    (String) d[3], (String) d[4], (String) d[5],
                    (String) d[6], (String) d[7]
                );
            }

            log.info("====== DONNÉES DE DÉMONSTRATION CHARGÉES AVEC SUCCÈS ======");
        }
    }

    private TypeReclamation createType(String nom) {
        TypeReclamation t = new TypeReclamation();
        t.setNomType(nom);
        return t;
    }

    private RoleReferentiel createRole(String code, String libelle, String profil, String niveau) {
        RoleReferentiel r = new RoleReferentiel();
        r.setCode(code);
        r.setLibelle(libelle);
        r.setProfil(profil);
        r.setNiveau(niveau);
        r.setDescription(libelle);
        return r;
    }

    private void saveEquipe(String nom, String niveau, String domaine, String description) {
        EquipeSupport equipe = new EquipeSupport();
        equipe.setNom(nom);
        equipe.setNiveau(niveau);
        equipe.setDomaine(domaine);
        equipe.setDescription(description);
        equipeSupportRepository.save(equipe);
    }

    private void saveEquipeSiAbsent(String nom, String niveau, String domaine, String description) {
        if (equipeSupportRepository.findByNiveauAndDomaine(niveau, domaine).isEmpty()) {
            saveEquipe(nom, niveau, domaine, description);
        }
    }

    private void creerChargeSiAbsent(String email, String nom, Agence agence, String matricule, EquipeSupport equipe) {
        if (agentRepository.findByEmail(email).isEmpty()) {
            Agent agent = new Agent();
            agent.setNom(nom);
            agent.setEmail(email);
            agent.setUsername(email);
            agent.setPassword(passwordEncoder.encode("kossa2026"));
            agent.setRole("ROLE_CHARGE_RECLAMATION");
            agent.setMatricule(matricule);
            agent.setAgence(agence);
            agent.setEquipeSupport(equipe);
            utilisateurRepository.save(agent);
            log.info("Chargé de réclamation créé: {} / kossa2026 ({})", email, agence != null ? agence.getNom() : "sans agence");
        }
    }

    private void creerGestionnaireSiAbsent(String email, String nom) {
        if (managerRepository.findByEmail(email).isEmpty()) {
            Manager manager = new Manager();
            manager.setNom(nom);
            manager.setEmail(email);
            manager.setUsername(email);
            manager.setPassword(passwordEncoder.encode("kossa2026"));
            manager.setRole("ROLE_GESTIONNAIRE");
            manager.setDepartement("Gestion des réclamations");
            utilisateurRepository.save(manager);
            log.info("Gestionnaire de réclamations créé: {} / kossa2026", email);
        }
    }

    private void creerChefSisavSiAbsent(String email, String nom, Agence agence, String region) {
        if (managerRepository.findByEmail(email).isEmpty()) {
            Manager manager = new Manager();
            manager.setNom(nom);
            manager.setEmail(email);
            manager.setUsername(email);
            manager.setPassword(passwordEncoder.encode("kossa2026"));
            manager.setRole("ROLE_CHEF_SAV");
            manager.setDepartement("SISAV");
            manager.setRegion(region);
            manager.setAgence(agence);
            utilisateurRepository.save(manager);
            log.info("Chef SISAV créé: {} / kossa2026 ({}, agence: {})", email, region, agence != null ? agence.getNom() : "aucune");
        }
    }

    private void saveAgence(String nom, String ville, String code, String region) {
        Agence agence = new Agence();
        agence.setNom(nom);
        agence.setVille(ville);
        agence.setCode(code);
        agence.setRegion(region);
        agenceRepository.save(agence);
    }

    /** Région par défaut d'une agence existante sans région (rattachement aux 6 directions régionales). */
    private String regionParDefaut(Agence agence) {
        String ville = agence.getVille() != null ? agence.getVille().toLowerCase() : "";
        if (ville.contains("ouagadougou")) return "Centre";
        if (ville.contains("bobo")) return "Ouest";
        if (ville.contains("koudougou")) return "Centre-Ouest";
        if (ville.contains("gaoua")) return "Sud-Ouest";
        if (ville.contains("tenkodogo")) return "Centre-Est";
        if (ville.contains("ouahigouya") || ville.contains("yako")) return "Nord";
        if (ville.contains("kaya") || ville.contains("kongoussi")) return "Centre-Nord";
        if (ville.contains("dori") || ville.contains("gorom")) return "Sahel";
        if (ville.contains("fada") || ville.contains("kantchari")) return "Est";
        if (ville.contains("dedougou") || ville.contains("nouna")) return "Boucle du Mouhoun";
        if (ville.contains("banfora")) return "Cascades";
        if (ville.contains("ziniare")) return "Plateau-Central";
        if (ville.contains("po") || ville.contains("kombissiri")) return "Centre-Sud";
        return "Centre";
    }

    private void creerAdminAgenceSiAbsent(String email, String nom, Agence agence, String niveau) {
        if (utilisateurRepository.findByEmail(email).isEmpty()) {
            Admin admin = new Admin();
            admin.setNom(nom);
            admin.setEmail(email);
            admin.setUsername(email);
            admin.setPassword(passwordEncoder.encode("kossa2026"));
            admin.setRole("ROLE_ADMIN");
            admin.setNiveau(niveau);
            admin.setAgence(agence);
            utilisateurRepository.save(admin);
            log.info("Admin agence créé: {} / kossa2026 ({})", email, agence != null ? agence.getNom() : "sans agence");
        }
    }

    private void creerManagerAgenceSiAbsent(String email, String nom, Agence agence, String departement) {
        if (managerRepository.findByEmail(email).isEmpty()) {
            Manager manager = new Manager();
            manager.setNom(nom);
            manager.setEmail(email);
            manager.setUsername(email);
            manager.setPassword(passwordEncoder.encode("kossa2026"));
            manager.setRole("ROLE_CHEF_SAV");
            manager.setDepartement(departement);
            manager.setAgence(agence);
            utilisateurRepository.save(manager);
            log.info("Chef SAV créé: {} / kossa2026 ({})", email, agence != null ? agence.getNom() : "sans agence");
        }
    }

    private void creerChefAgenceSiAbsent(String email, String nom, Agence agence, String departement) {
        if (managerRepository.findByEmail(email).isEmpty()) {
            Manager manager = new Manager();
            manager.setNom(nom);
            manager.setEmail(email);
            manager.setUsername(email);
            manager.setPassword(passwordEncoder.encode("kossa2026"));
            manager.setRole("ROLE_CHEF_AGENCE");
            manager.setDepartement(departement);
            manager.setAgence(agence);
            utilisateurRepository.save(manager);
            log.info("Chef d'agence créé (ROLE_CHEF_AGENCE): {} / kossa2026 ({})", email, agence != null ? agence.getNom() : "sans agence");
        }
    }

    private void creerSuperviseurAgenceSiAbsent(String email, String nom, Agence agence, String departement) {
        if (superviseurRepository.findByEmail(email).isEmpty()) {
            Superviseur superviseur = new Superviseur();
            superviseur.setNom(nom);
            superviseur.setEmail(email);
            superviseur.setUsername(email);
            superviseur.setPassword(passwordEncoder.encode("kossa2026"));
            superviseur.setRole("ROLE_SUPERVISEUR");
            superviseur.setDepartement(departement);
            superviseur.setAgence(agence);
            utilisateurRepository.save(superviseur);
            log.info("Superviseur agence créé: {} / kossa2026 ({})", email, agence != null ? agence.getNom() : "sans agence");
        }
    }
}
