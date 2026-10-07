package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "roles_referentiels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleReferentiel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false)
    private String profil;

    @Column
    private String niveau;

    @Column(columnDefinition = "TEXT")
    private String description;
}
