package com.kossa.repository;

import com.kossa.entity.Superviseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SuperviseurRepository extends JpaRepository<Superviseur, Long> {
    Optional<Superviseur> findByEmail(String email);
}