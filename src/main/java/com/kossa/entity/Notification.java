package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_envoi", nullable = false)
    private Date dateEnvoi;

    @Column(nullable = false)
    private String statut;

    @Column(nullable = false)
    private String destinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canal_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Canal canal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Reclamation reclamation;
}
