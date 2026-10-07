package com.kossa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "utilisateurs")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
public abstract class Utilisateur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false, unique = true)
    private String email; // Sert d'identifiant de connexion (username)
    
    @Column(nullable = false)
    private String username;
    
    @JsonIgnore
    @Column(nullable = false)
    private String password; // Mot de passe chiffré (BCrypt)
    
    @Column(nullable = false)
    private String role; // ROLE_AGENT, ROLE_CHEF_AGENCE, ROLE_ADMIN

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agence_id")
    private Agence agence;
}
