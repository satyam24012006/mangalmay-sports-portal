package com.mangalmay.sports.repo;

import com.mangalmay.sports.model.Sport;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SportRepository extends JpaRepository<Sport, UUID> {
    List<Sport> findAllByOrderByCreatedAtAscNameAsc();

    /** Row lock so two students can't grab the last slot at the same time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Sport s where s.id = :id")
    Optional<Sport> findByIdForUpdate(@Param("id") UUID id);
}
