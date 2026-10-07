package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "equipes_support")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipeSupport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(nullable = false)
    private String niveau;

    @Column
    private String domaine;

    @Column(columnDefinition = "TEXT")
    private String description;
}
