package com.kossa.repository;

import com.kossa.entity.TicketResolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketResolutionRepository extends JpaRepository<TicketResolution, Long> {

    Optional<TicketResolution> findByReclamationId(Long reclamationId);
}
