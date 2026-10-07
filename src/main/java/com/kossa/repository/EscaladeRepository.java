package com.kossa.repository;

import com.kossa.entity.Escalade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EscaladeRepository extends JpaRepository<Escalade, Long> {
    List<Escalade> findByReclamation_Id(Long reclamationId);
    List<Escalade> findByManager_Id(Long managerId);
    Page<Escalade> findByManager_Id(Long managerId, Pageable pageable);
    List<Escalade> findByNiveau(String niveau);
    Page<Escalade> findByStatut(String statut, Pageable pageable);
    List<Escalade> findByStatut(String statut);
}
