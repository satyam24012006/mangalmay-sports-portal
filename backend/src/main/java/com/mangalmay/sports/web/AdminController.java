package com.mangalmay.sports.web;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.model.User;
import com.mangalmay.sports.service.AdminService;
import com.mangalmay.sports.service.CatalogService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Everything under /api/admin requires the ADMIN role (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService admin;
    private final CatalogService catalog;

    public AdminController(AdminService admin, CatalogService catalog) {
        this.admin = admin;
        this.catalog = catalog;
    }

    // users
    @GetMapping("/users")
    public List<UserDto> users() { return admin.users(); }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody AdminCreateUser r) { return admin.createUser(r); }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id, @AuthenticationPrincipal User me) { admin.deleteUser(id, me); }

    // events
    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventDto createEvent(@Valid @RequestBody EventRequest r) { return catalog.createEvent(r); }

    @PutMapping("/events/{id}")
    public EventDto updateEvent(@PathVariable UUID id, @Valid @RequestBody EventRequest r) {
        return catalog.updateEvent(id, r);
    }

    @DeleteMapping("/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable UUID id) { catalog.deleteEvent(id); }

    // sports
    @PostMapping("/sports")
    @ResponseStatus(HttpStatus.CREATED)
    public SportDto createSport(@Valid @RequestBody SportRequest r) { return catalog.createSport(r); }

    @PutMapping("/sports/{id}")
    public SportDto updateSport(@PathVariable UUID id, @Valid @RequestBody SportRequest r) {
        return catalog.updateSport(id, r);
    }

    @DeleteMapping("/sports/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSport(@PathVariable UUID id) { catalog.deleteSport(id); }

    // enrollments / payments
    @GetMapping("/enrollments")
    public List<EnrollmentDto> enrollments() { return admin.allEnrollments(); }

    @PatchMapping("/enrollments/{id}/status")
    public EnrollmentDto setStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest r) {
        return admin.setStatus(id, r.status());
    }

    @DeleteMapping("/enrollments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEnrollment(@PathVariable UUID id) { admin.deleteEnrollment(id); }

    // dashboard
    @GetMapping("/stats")
    public StatsDto stats() { return admin.stats(); }

    @GetMapping("/payments/export")
    public ResponseEntity<byte[]> export() {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .cacheControl(CacheControl.noStore())
                .header("Content-Disposition", "attachment; filename=\"mangalmay-payments.csv\"")
                .body(admin.paymentsCsv().getBytes(StandardCharsets.UTF_8));
    }
}
