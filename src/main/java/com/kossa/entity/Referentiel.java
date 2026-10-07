package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "referentiels")
@Data
public class Referentiel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;
}
