package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Entity
@Table(name = "managers")
@Data
@EqualsAndHashCode(callSuper = true)
public class Manager extends Utilisateur {

    @Column
    private String departement;

    @Column
    private String region;

    @OneToMany(mappedBy = "manager", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Escalade> escalades;
}
