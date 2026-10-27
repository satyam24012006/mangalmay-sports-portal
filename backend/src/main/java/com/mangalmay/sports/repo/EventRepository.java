package com.mangalmay.sports.repo;

import com.mangalmay.sports.model.Event;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findAllByOrderByEventDateAscNameAsc();
}
