package com.mangalmay.sports.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;


public final class Dtos {
    private Dtos() {}

    // ---- auth ----
    public record SignupRequest(
            @NotBlank(message = "Name is required") @Size(max = 100) String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 150) String email,
            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters") String password,
            @Size(max = 150) String college) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String token, UserDto user) {}

    /** role is "admin" or "user" (what the frontend checks). enrollments is only filled for admin listings. */
    public record UserDto(UUID id, String name, String email, String college, String role,
                          Instant createdAt, Long enrollments) {}

    public record AdminCreateUser(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters") String password,
            @Size(max = 150) String college) {}

    // ---- catalog ----
    public record SportDto(UUID id, String name, String category, int fee, String teamSize, int slots,
                           String icon, String color, int remaining) {}

    public record SportRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 50) String category,
            @Min(0) @Max(100000) int fee,
            @NotBlank @Size(max = 60) String teamSize,
            @Min(1) @Max(1000) int slots,
            @NotBlank @Size(max = 16) String icon,
            @NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Color must look like #c7ff4d") String color) {}

    public record EventDto(UUID id, String name, LocalDate date, String venue, String status, String desc) {}

    public record EventRequest(
            @NotBlank @Size(max = 150) String name,
            @NotNull(message = "Date is required") LocalDate date,
            @NotBlank @Size(max = 150) String venue,
            @NotBlank @Pattern(regexp = "Registration open|Coming soon|Closed",
                    message = "Status must be Registration open, Coming soon or Closed") String status,
            @Size(max = 500) String desc) {}

    // ---- enrollments ----
    public record MemberDto(@Size(max = 100) String name, @Size(max = 20) String phone) {}

    public record EnrollmentDraftRequest(
            UUID id,
            @NotNull UUID eventId,
            UUID sportId,
            @Size(max = 100) String name,
            @Size(max = 150) String email,
            @Size(max = 20) String phone,
            @Size(max = 150) String college,
            @Size(max = 100) String team,
            @Valid @Size(max = 30) List<MemberDto> members,
            Integer step) {}

    public record EnrollmentDto(UUID id, UUID userId, UUID eventId, String eventName, UUID sportId, String sportName,
                                String name, String email, String phone, String college, String team,
                                List<MemberDto> members, int fee, String status, int step, String utr,
                                boolean hasProof, Instant submittedAt, Instant verifiedAt, Instant createdAt) {}

    public record StatusRequest(@NotBlank String status) {}

    public record StatsDto(long users, long enrollments, long verifiedRevenue, long pending, long verified,
                           long rejected, long events, long sports) {}
}
