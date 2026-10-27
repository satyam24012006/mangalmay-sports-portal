package com.mangalmay.sports.repo;

import com.mangalmay.sports.model.Enrollment;
import com.mangalmay.sports.model.EnrollmentStatus;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    List<Enrollment> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Enrollment> findAllByOrderByCreatedAtDesc();

    boolean existsByUtrAndIdNot(String utr, UUID id);
    long countByUserId(UUID userId);
    long countByStatus(EnrollmentStatus status);

    long countBySportIdAndEventIdAndStatusIn(UUID sportId, UUID eventId, Collection<EnrollmentStatus> statuses);
    boolean existsByUserIdAndEventIdAndSportIdAndStatusIn(UUID userId, UUID eventId, UUID sportId,
                                                          Collection<EnrollmentStatus> statuses);

    boolean existsByUserIdAndStatusNot(UUID userId, EnrollmentStatus status);
    boolean existsByEventIdAndStatusNot(UUID eventId, EnrollmentStatus status);
    boolean existsBySportIdAndStatusNot(UUID sportId, EnrollmentStatus status);

    void deleteByUserId(UUID userId);
    void deleteByEventId(UUID eventId);
    void deleteBySportId(UUID sportId);
}
