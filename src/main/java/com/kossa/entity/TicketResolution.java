package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "tickets_resolution")
@Data
public class TicketResolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_resolution")
    private Date dateResolution;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "statut_validation")
    private String statutValidation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Reclamation reclamation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Agent agent;
}
