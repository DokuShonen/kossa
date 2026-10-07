package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "escalades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Escalade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String niveau;

    @Column(nullable = false)
    private String statut;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_escalade")
    private Date dateEscalade;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Reclamation reclamation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Manager manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_support_id")
    private EquipeSupport equipeSupport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Agent agent;
}
