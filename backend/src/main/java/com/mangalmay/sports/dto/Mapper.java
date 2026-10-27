package com.mangalmay.sports.dto;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.model.*;
import java.util.List;

public final class Mapper {
    private Mapper() {}

    public static UserDto user(User u, Long enrollments) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getCollege(),
                u.getRole() == Role.ADMIN ? "admin" : "user", u.getCreatedAt(), enrollments);
    }

    public static SportDto sport(Sport s, int remaining) {
        return new SportDto(s.getId(), s.getName(), s.getCategory(), s.getFee(), s.getTeamSize(),
                s.getSlots(), s.getIcon(), s.getColor(), Math.max(0, remaining));
    }

    public static EventDto event(Event e) {
        return new EventDto(e.getId(), e.getName(), e.getEventDate(), e.getVenue(), e.getStatus(), e.getDescription());
    }

    public static EnrollmentDto enrollment(Enrollment e) {
        Sport s = e.getSport();
        List<MemberDto> members = e.getMembers().stream().map(m -> new MemberDto(m.getName(), m.getPhone())).toList();
        // while still a draft the fee follows the sport's current price; it is frozen once payment is submitted
        int fee = (e.getStatus() == EnrollmentStatus.DRAFT && s != null) ? s.getFee() : e.getFee();
        return new EnrollmentDto(e.getId(), e.getUser().getId(), e.getEvent().getId(), e.getEvent().getName(),
                s == null ? null : s.getId(), s == null ? null : s.getName(),
                e.getName(), e.getEmail(), e.getPhone(), e.getCollege(), e.getTeamName(), members, fee,
                e.getStatus().name().toLowerCase(), e.getStep(), e.getUtr(), e.getProofPath() != null,
                e.getSubmittedAt(), e.getVerifiedAt(), e.getCreatedAt());
    }
}
