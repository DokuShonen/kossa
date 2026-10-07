package com.kossa.repository;

import com.kossa.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByReclamationId(Long reclamationId);

    List<Notification> findByDestinataire(String destinataire);

    @Query("SELECT n FROM Notification n WHERE n.destinataire = :email AND n.statut = 'NON_LUE' ORDER BY n.dateEnvoi DESC")
    List<Notification> findNonLuesByEmail(@Param("email") String email);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.destinataire = :email AND n.statut = 'NON_LUE'")
    Long countNonLuesByEmail(@Param("email") String email);
}
