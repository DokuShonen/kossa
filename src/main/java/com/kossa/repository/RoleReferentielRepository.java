package com.kossa.repository;

import com.kossa.entity.RoleReferentiel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoleReferentielRepository extends JpaRepository<RoleReferentiel, Long> {
    Optional<RoleReferentiel> findByCode(String code);
    boolean existsByCode(String code);
}