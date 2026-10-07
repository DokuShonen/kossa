package com.kossa.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "plans_action")
@Data
public class PlanAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column
    private String domaine;

    @Temporal(TemporalType.DATE)
    @Column(name = "date_execution")
    private Date dateExecution;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", referencedColumnName = "id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Reclamation reclamation;
}
