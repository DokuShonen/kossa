package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "superviseurs")
@Data
@EqualsAndHashCode(callSuper = true)
public class Superviseur extends Utilisateur {

    @Column
    private String departement;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipe_supervisee_id")
    private EquipeSupport equipeSupervisee;
}
