package com.kossa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "slas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SLA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "temps_maximum_heures", nullable = false)
    private int tempsMaximumHeures;

    @Column
    private String niveau = "STANDARD";

    @OneToOne(mappedBy = "sla", fetch = FetchType.LAZY)
    @JsonIgnore
    private Categorie categorie;
}
