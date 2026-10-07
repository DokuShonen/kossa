package com.kossa.repository;

import com.kossa.entity.TypeReclamation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TypeReclamationRepository extends JpaRepository<TypeReclamation, Long> {
    Optional<TypeReclamation> findByNomType(String nomType);
}
