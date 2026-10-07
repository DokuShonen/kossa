package com.kossa.repository;

import com.kossa.entity.Agent;
import com.kossa.entity.Agence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByEmail(String email);
    List<Agent> findByRoleAndEquipeSupport_Niveau(String role, String niveau);
    List<Agent> findByRoleAndEquipeSupport_NiveauAndEquipeSupport_Domaine(String role, String niveau, String domaine);
    List<Agent> findByEquipeSupport_Domaine(String domaine);
    List<Agent> findByAgence(Agence agence);
}
