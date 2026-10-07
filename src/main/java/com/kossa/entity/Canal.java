package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "canaux")
@Data
public class Canal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_canal", nullable = false, unique = true)
    private String nomCanal;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean actif = true;
}
