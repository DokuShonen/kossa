package com.kossa.repository;

import com.kossa.entity.HistoriqueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoriqueTicketRepository extends JpaRepository<HistoriqueTicket, Long> {
    List<HistoriqueTicket> findByReclamationIdOrderByDateActionDesc(Long reclamationId);
}
