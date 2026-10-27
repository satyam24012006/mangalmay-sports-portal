package com.mangalmay.sports.service;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.dto.Mapper;
import com.mangalmay.sports.model.*;
import com.mangalmay.sports.repo.*;
import com.mangalmay.sports.web.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Users, enrollment review, stats and CSV export for the admin dashboard. */
@Service
public class AdminService {
    private final UserRepository users;
    private final EnrollmentRepository enrollments;
    private final EventRepository events;
    private final SportRepository sports;
    private final PasswordEncoder encoder;
    private final FileStorageService files;

    public AdminService(UserRepository users, EnrollmentRepository enrollments, EventRepository events,
                        SportRepository sports, PasswordEncoder encoder, FileStorageService files) {
        this.users = users;
        this.enrollments = enrollments;
        this.events = events;
        this.sports = sports;
        this.encoder = encoder;
        this.files = files;
    }

    // ---- users ----
    @Transactional(readOnly = true)
    public List<UserDto> users() {
        return users.findAllByOrderByCreatedAtDesc().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .map(u -> Mapper.user(u, enrollments.countByUserId(u.getId())))
                .toList();
    }

    @Transactional
    public UserDto createUser(AdminCreateUser r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) throw ApiException.conflict("An account with this email already exists.");
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setCollege(r.college() == null ? null : r.college().trim());
        u.setRole(Role.STUDENT);
        return Mapper.user(users.save(u), 0L);
    }

    @Transactional
    public void deleteUser(UUID id, User me) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));
        if (u.getRole() == Role.ADMIN || u.getId().equals(me.getId())) {
            throw ApiException.badRequest("Admin accounts can't be removed here.");
        }
        if (enrollments.existsByUserIdAndStatusNot(id, EnrollmentStatus.DRAFT)) {
            throw ApiException.conflict("This user has submitted registrations. Remove those first.");
        }
        enrollments.deleteByUserId(id);   // only unsubmitted drafts remain
        users.delete(u);
    }

    // ---- enrollments ----
    @Transactional(readOnly = true)
    public List<EnrollmentDto> allEnrollments() {
        return enrollments.findAllByOrderByCreatedAtDesc().stream().map(Mapper::enrollment).toList();
    }

    @Transactional
    public EnrollmentDto setStatus(UUID id, String status) {
        Enrollment e = enrollments.findById(id).orElseThrow(() -> ApiException.notFound("Registration not found."));
        EnrollmentStatus target = switch (status.toLowerCase()) {
            case "verified" -> EnrollmentStatus.VERIFIED;
            case "rejected" -> EnrollmentStatus.REJECTED;
            default -> throw ApiException.badRequest("Status must be verified or rejected.");
        };
        if (e.getStatus() != EnrollmentStatus.PENDING) {
            throw ApiException.conflict("Only pending payments can be verified or rejected.");
        }
        e.setStatus(target);
        e.setVerifiedAt(Instant.now());
        return Mapper.enrollment(enrollments.save(e));
    }

    @Transactional
    public void deleteEnrollment(UUID id) {
        Enrollment e = enrollments.findById(id).orElseThrow(() -> ApiException.notFound("Registration not found."));
        if (e.getStatus() == EnrollmentStatus.PENDING) {
            throw ApiException.conflict("Verify or reject this payment before removing it.");
        }
        files.delete(e.getProofPath());
        enrollments.delete(e);
    }

    // ---- stats / export ----
    @Transactional(readOnly = true)
    public StatsDto stats() {
        long revenue = enrollments.findAllByOrderByCreatedAtDesc().stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.VERIFIED)
                .mapToLong(Enrollment::getFee).sum();
        return new StatsDto(
                users().size(),
                enrollments.count(),
                revenue,
                enrollments.countByStatus(EnrollmentStatus.PENDING),
                enrollments.countByStatus(EnrollmentStatus.VERIFIED),
                enrollments.countByStatus(EnrollmentStatus.REJECTED),
                events.count(),
                sports.count());
    }

    @Transactional(readOnly = true)
    public String paymentsCsv() {
        StringBuilder sb = new StringBuilder("ID,Participant,Email,Phone,College,Event,Sport,Team,Amount,UTR,Status,Submitted\n");
        for (Enrollment e : enrollments.findAllByOrderByCreatedAtDesc()) {
            if (e.getStatus() == EnrollmentStatus.DRAFT) continue;
            sb.append(String.join(",",
                    cell(e.getId()), cell(e.getName()), cell(e.getEmail()), cell(e.getPhone()), cell(e.getCollege()),
                    cell(e.getEvent().getName()), cell(e.getSport() == null ? "" : e.getSport().getName()),
                    cell(e.getTeamName()), cell(e.getFee()), cell(e.getUtr()),
                    cell(e.getStatus().name().toLowerCase()), cell(e.getSubmittedAt()))).append('\n');
        }
        return sb.toString();
    }

    /** Quotes the value and neutralises spreadsheet formula injection (=, +, -, @ at the start). */
    private static String cell(Object v) {
        String s = v == null ? "" : String.valueOf(v);
        if (!s.isEmpty() && "=+-@\t\r".indexOf(s.charAt(0)) >= 0) s = "'" + s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
