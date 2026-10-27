package com.mangalmay.sports.service;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.dto.Mapper;
import com.mangalmay.sports.model.*;
import com.mangalmay.sports.repo.*;
import com.mangalmay.sports.web.ApiException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Events and sports: public reads + admin writes. */
@Service
public class CatalogService {
    static final List<EnrollmentStatus> HOLDING = List.of(EnrollmentStatus.PENDING, EnrollmentStatus.VERIFIED);

    private final EventRepository events;
    private final SportRepository sports;
    private final EnrollmentRepository enrollments;

    public CatalogService(EventRepository events, SportRepository sports, EnrollmentRepository enrollments) {
        this.events = events;
        this.sports = sports;
        this.enrollments = enrollments;
    }

    // ---- reads ----
    @Transactional(readOnly = true)
    public List<EventDto> events() {
        return events.findAllByOrderByEventDateAscNameAsc().stream().map(Mapper::event).toList();
    }

    /** Slots are per event: pass eventId to get the slots still open for that event (null = full capacity). */
    @Transactional(readOnly = true)
    public List<SportDto> sports(UUID eventId) {
        return sports.findAllByOrderByCreatedAtAscNameAsc().stream().map(s -> toDto(s, eventId)).toList();
    }

    private SportDto toDto(Sport s, UUID eventId) {
        int taken = eventId == null ? 0
                : (int) enrollments.countBySportIdAndEventIdAndStatusIn(s.getId(), eventId, HOLDING);
        return Mapper.sport(s, s.getSlots() - taken);
    }

    // ---- events (admin) ----
    @Transactional
    public EventDto createEvent(EventRequest r) {
        Event e = new Event();
        apply(e, r);
        return Mapper.event(events.save(e));
    }

    @Transactional
    public EventDto updateEvent(UUID id, EventRequest r) {
        Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event not found."));
        apply(e, r);
        return Mapper.event(events.save(e));
    }

    @Transactional
    public void deleteEvent(UUID id) {
        Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event not found."));
        if (enrollments.existsByEventIdAndStatusNot(id, EnrollmentStatus.DRAFT)) {
            throw ApiException.conflict("This event has submitted registrations. Remove them first, or set the event to Closed.");
        }
        enrollments.deleteByEventId(id);   // only unsubmitted drafts remain
        events.delete(e);
    }

    private static void apply(Event e, EventRequest r) {
        e.setName(r.name().trim());
        e.setEventDate(r.date());
        e.setVenue(r.venue().trim());
        e.setStatus(r.status());
        e.setDescription(r.desc() == null ? "" : r.desc().trim());
    }

    // ---- sports (admin) ----
    @Transactional
    public SportDto createSport(SportRequest r) {
        Sport s = new Sport();
        apply(s, r);
        return toDto(sports.save(s), null);
    }

    @Transactional
    public SportDto updateSport(UUID id, SportRequest r) {
        Sport s = sports.findById(id).orElseThrow(() -> ApiException.notFound("Sport not found."));
        apply(s, r);
        return toDto(sports.save(s), null);
    }

    @Transactional
    public void deleteSport(UUID id) {
        Sport s = sports.findById(id).orElseThrow(() -> ApiException.notFound("Sport not found."));
        if (enrollments.existsBySportIdAndStatusNot(id, EnrollmentStatus.DRAFT)) {
            throw ApiException.conflict("This sport has submitted registrations. Remove them first.");
        }
        enrollments.deleteBySportId(id);
        sports.delete(s);
    }

    private static void apply(Sport s, SportRequest r) {
        s.setName(r.name().trim());
        s.setCategory(r.category().trim());
        s.setFee(r.fee());
        s.setTeamSize(r.teamSize().trim());
        s.setSlots(r.slots());
        s.setIcon(r.icon().trim());
        s.setColor(r.color());
    }
}
