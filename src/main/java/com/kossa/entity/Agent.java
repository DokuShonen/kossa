package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "agents")
@Getter
@Setter
public class Agent extends Utilisateur {

    public Agent() {}

    @Column
    private String matricule;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipe_support_id")
    private EquipeSupport equipeSupport;
}
