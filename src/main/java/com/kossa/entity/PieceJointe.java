package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "pieces_jointes")
@Data
public class PieceJointe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_fichier", nullable = false)
    private String nomFichier;

    @Column(nullable = false)
    private String type;

    @Column(name = "chemin_fichier")
    private String cheminFichier;

    @Column(name = "taille_octets")
    private Long tailleOctets;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Reclamation reclamation;
}
