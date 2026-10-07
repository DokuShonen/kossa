package com.kossa.repository;

import com.kossa.entity.EquipeSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EquipeSupportRepository extends JpaRepository<EquipeSupport, Long> {
    Optional<EquipeSupport> findByNiveau(String niveau);
    Optional<EquipeSupport> findByNom(String nom);
    Optional<EquipeSupport> findByNiveauAndDomaine(String niveau, String domaine);
    List<EquipeSupport> findByDomaine(String domaine);
}
