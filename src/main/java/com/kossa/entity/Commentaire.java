package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "commentaires")
@Data
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_action", nullable = false)
    private Date dateAction;

    @Column(nullable = false)
    private String auteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    private Reclamation reclamation;
}
