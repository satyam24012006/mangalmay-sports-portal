package com.mangalmay.sports.service;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.dto.Mapper;
import com.mangalmay.sports.model.*;
import com.mangalmay.sports.repo.*;
import com.mangalmay.sports.web.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EnrollmentService {
    private static final Pattern PHONE = Pattern.compile("^[6-9]\\d{9}$");        // Indian 10-digit mobile
    private static final Pattern UTR = Pattern.compile("^\\d{12}$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public record ProofFile(byte[] bytes, String contentType) {}

    private final EnrollmentRepository enrollments;
    private final EventRepository events;
    private final SportRepository sports;
    private final FileStorageService files;

    public EnrollmentService(EnrollmentRepository enrollments, EventRepository events,
                             SportRepository sports, FileStorageService files) {
        this.enrollments = enrollments;
        this.events = events;
        this.sports = sports;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDto> mine(User me) {
        return enrollments.findByUserIdOrderByCreatedAtDesc(me.getId()).stream().map(Mapper::enrollment).toList();
    }

    @Transactional(readOnly = true)
    public EnrollmentDto get(UUID id, User me) {
        return Mapper.enrollment(owned(id, me));
    }

    /** Auto-save endpoint: creates a draft or updates an existing DRAFT/REJECTED one. Partial data is fine here. */
    @Transactional
    public EnrollmentDto saveDraft(User me, EnrollmentDraftRequest r) {
        Event ev = events.findById(r.eventId()).orElseThrow(() -> ApiException.notFound("Event not found."));
        if (!ev.isOpen()) throw ApiException.conflict("Registration is not open for this event.");

        Enrollment e;
        if (r.id() == null) {
            e = new Enrollment();
            e.setUser(me);
            e.setEvent(ev);
        } else {
            e = owned(r.id(), me);
            if (!e.getEvent().getId().equals(ev.getId())) throw ApiException.badRequest("Event mismatch.");
            if (e.getStatus() != EnrollmentStatus.DRAFT && e.getStatus() != EnrollmentStatus.REJECTED) {
                throw ApiException.conflict("This registration was already submitted and can't be edited.");
            }
            e.setStatus(EnrollmentStatus.DRAFT);   // a rejected entry goes back to draft for resubmission
        }

        if (r.sportId() != null) {
            Sport s = sports.findById(r.sportId()).orElseThrow(() -> ApiException.notFound("Sport not found."));
            if (enrollments.existsByUserIdAndEventIdAndSportIdAndStatusIn(
                    me.getId(), ev.getId(), s.getId(), CatalogService.HOLDING)) {
                throw ApiException.conflict("You already have a registration for " + s.getName() + " in this event.");
            }
            e.setSport(s);
        } else {
            e.setSport(null);
        }

        e.setName(clean(r.name()));
        e.setEmail(clean(r.email()));
        e.setPhone(clean(r.phone()));
        e.setCollege(clean(r.college()));
        e.setTeamName(clean(r.team()));
        e.setStep(r.step() == null ? 1 : Math.min(3, Math.max(1, r.step())));
        e.getMembers().clear();
        if (r.members() != null) {
            for (MemberDto m : r.members()) e.getMembers().add(new TeamMember(clean(m.name()), clean(m.phone())));
        }
        return Mapper.enrollment(enrollments.save(e));
    }

    /** Final submit: validates everything, enforces slot limit, stores the screenshot, moves DRAFT -> PENDING. */
    @Transactional
    public EnrollmentDto submitPayment(User me, UUID id, String utrRaw, MultipartFile file) {
        Enrollment e = owned(id, me);
        if (e.getStatus() != EnrollmentStatus.DRAFT) {
            throw ApiException.conflict("Payment proof was already submitted for this registration.");
        }
        String utr = utrRaw == null ? "" : utrRaw.trim();
        if (!UTR.matcher(utr).matches()) throw ApiException.badRequest("UTR must be a 12-digit number.");
        if (!e.getEvent().isOpen()) throw ApiException.conflict("Registration is not open for this event.");
        if (e.getSport() == null) throw ApiException.badRequest("Choose a sport first.");
        validateComplete(e);
        if (enrollments.existsByUtrAndIdNot(utr, e.getId())) {
            throw ApiException.conflict("This UTR has already been used for another registration.");
        }

        // lock the sport row so the slot count can't be raced
        Sport sport = sports.findByIdForUpdate(e.getSport().getId())
                .orElseThrow(() -> ApiException.notFound("Sport not found."));
        if (enrollments.existsByUserIdAndEventIdAndSportIdAndStatusIn(
                me.getId(), e.getEvent().getId(), sport.getId(), CatalogService.HOLDING)) {
            throw ApiException.conflict("You already have a registration for " + sport.getName() + " in this event.");
        }
        if (enrollments.countBySportIdAndEventIdAndStatusIn(sport.getId(), e.getEvent().getId(), CatalogService.HOLDING) >= sport.getSlots()) {
            throw ApiException.conflict("No slots left for " + sport.getName() + ".");
        }

        String saved = files.saveProof(file);
        String old = e.getProofPath();
        e.setProofPath(saved);
        e.setUtr(utr);
        e.setFee(sport.getFee());
        e.setStatus(EnrollmentStatus.PENDING);
        e.setSubmittedAt(Instant.now());
        e.setVerifiedAt(null);
        enrollments.save(e);
        files.delete(old);
        return Mapper.enrollment(e);
    }

    @Transactional(readOnly = true)
    public ProofFile proof(UUID id, User me) {
        Enrollment e = enrollments.findById(id).orElseThrow(() -> ApiException.notFound("Registration not found."));
        boolean allowed = me.getRole() == Role.ADMIN || e.getUser().getId().equals(me.getId());
        if (!allowed || e.getProofPath() == null) throw ApiException.notFound("Proof not found.");
        return new ProofFile(files.load(e.getProofPath()), files.contentType(e.getProofPath()));
    }

    // ---- helpers ----
    private Enrollment owned(UUID id, User me) {
        return enrollments.findById(id)
                .filter(x -> x.getUser().getId().equals(me.getId()))
                .orElseThrow(() -> ApiException.notFound("Registration not found."));
    }

    private static String clean(String s) {
        return s == null ? null : s.trim();
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static void validateComplete(Enrollment e) {
        if (blank(e.getName())) throw ApiException.badRequest("Full name is required.");
        if (blank(e.getEmail()) || !EMAIL.matcher(e.getEmail()).matches()) throw ApiException.badRequest("Enter a valid email address.");
        if (blank(e.getPhone()) || !PHONE.matcher(e.getPhone()).matches()) throw ApiException.badRequest("Enter a valid 10-digit mobile number.");
        if (blank(e.getCollege())) throw ApiException.badRequest("College is required.");

        TeamRules rules = TeamRules.parse(e.getSport().getTeamSize());
        if (rules.teamNameRequired() && blank(e.getTeamName())) throw ApiException.badRequest("Team name is required.");
        int n = e.getMembers().size();
        if (n < rules.min() || n > rules.max()) {
            String range = rules.min() == rules.max() ? String.valueOf(rules.min()) : rules.min() + " to " + rules.max();
            throw ApiException.badRequest(e.getSport().getName() + " needs " + range + " team members (you have " + n + ").");
        }
        for (TeamMember m : e.getMembers()) {
            if (blank(m.getName())) throw ApiException.badRequest("Every team member needs a name.");
            if (!blank(m.getPhone()) && !PHONE.matcher(m.getPhone()).matches()) {
                throw ApiException.badRequest("Invalid phone number for team member " + m.getName() + ".");
            }
        }
    }
}
