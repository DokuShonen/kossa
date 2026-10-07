package com.kossa.repository;

import com.kossa.entity.Reclamation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    Page<Reclamation> findByStatut(String statut, Pageable pageable);
    List<Reclamation> findByStatut(String statut);
    List<Reclamation> findByPriorite(String priorite);
    List<Reclamation> findByClient_Id(Long clientId);
    List<Reclamation> findByAgent_Id(Long agentId);

    Page<Reclamation> findByAgence_Id(Long agenceId, Pageable pageable);
    Page<Reclamation> findByAgence_IdAndStatut(Long agenceId, String statut, Pageable pageable);
    List<Reclamation> findByAgence_Id(Long agenceId);

    @Query("SELECT r FROM Reclamation r WHERE r.chefSisav.email = :email")
    List<Reclamation> findByChefSisavEmail(@Param("email") String email);

    @Query("SELECT r FROM Reclamation r WHERE r.statut = 'ASSIGNE_SISAV' OR r.chefSisav.email = :email")
    List<Reclamation> findBySisav(@Param("email") String email);

    @Query("SELECT r FROM Reclamation r WHERE r.agence.id = :agenceId AND (r.statut = 'ASSIGNE_SISAV' OR r.chefSisav.email = :email)")
    List<Reclamation> findByAgence_IdAndSisav(@Param("agenceId") Long agenceId, @Param("email") String email);

    /** Réclamations dont l'agence appartient à la direction régionale donnée (périmètre chef SAV). */
    @Query("SELECT r FROM Reclamation r WHERE r.agence.region = :region AND (r.statut = 'ASSIGNE_SISAV' OR r.chefSisav.email = :email)")
    List<Reclamation> findByRegionAndSisav(@Param("region") String region, @Param("email") String email);

    @Query("SELECT r FROM Reclamation r WHERE r.agent.email = :email")
    List<Reclamation> findByAgentEmail(@Param("email") String email);

    @Query("SELECT r FROM Reclamation r WHERE r.dateCreation BETWEEN :debut AND :fin")
    List<Reclamation> findByDateCreationBetween(@Param("debut") Date debut, @Param("fin") Date fin);

    @Query("SELECT r FROM Reclamation r WHERE r.dateEcheance < :date AND r.statut NOT IN :statuts")
    List<Reclamation> findByDateEcheanceBeforeAndStatutNotIn(@Param("date") Date date, @Param("statuts") List<String> statuts);

    @Query("SELECT r FROM Reclamation r WHERE " +
           "LOWER(r.reference) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.client.nom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.client.prenom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.client.msisdn) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.type) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Reclamation> rechercherParMotCle(@Param("keyword") String keyword);

    @Query("SELECT r.agent.email, r.agent.nom, COUNT(r) FROM Reclamation r WHERE r.agent IS NOT NULL GROUP BY r.agent.email, r.agent.nom")
    List<Object[]> compterTicketsParAgent();

    @Query("SELECT r FROM Reclamation r WHERE r.equipeSupport.domaine = :domaine")
    List<Reclamation> findByEquipeSupportDomaine(@Param("domaine") String domaine);

    @Query("SELECT r FROM Reclamation r WHERE r.equipeSupport.id = :equipeId")
    List<Reclamation> findByEquipeSupportId(@Param("equipeId") Long equipeId);

    @Query("SELECT r FROM Reclamation r WHERE r.agence.id = :agenceId AND r.equipeSupport.domaine = :domaine")
    List<Reclamation> findByAgence_IdAndEquipeSupportDomaine(@Param("agenceId") Long agenceId, @Param("domaine") String domaine);
}
