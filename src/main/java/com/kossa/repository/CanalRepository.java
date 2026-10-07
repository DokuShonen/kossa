package com.kossa.repository;

import com.kossa.entity.Canal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CanalRepository extends JpaRepository<Canal, Long> {

    Optional<Canal> findByNomCanal(String nomCanal);

    boolean existsByNomCanal(String nomCanal);
}
