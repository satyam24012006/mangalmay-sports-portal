package com.mangalmay.sports.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "enrollments")
@Getter @Setter @NoArgsConstructor
public class Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    private Event event;

    /** null until the student picks a sport (step 2). */
    @ManyToOne(fetch = FetchType.EAGER)
    private Sport sport;

    @Column(length = 100) private String name;
    @Column(length = 150) private String email;
    @Column(length = 20)  private String phone;
    @Column(length = 150) private String college;
    @Column(length = 100) private String teamName;

    /** Fee snapshot, set by the server when payment proof is submitted. */
    private int fee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.DRAFT;

    private int step = 1;

    @Column(unique = true, length = 30)
    private String utr;

    private String proofPath;
    private Instant submittedAt;
    private Instant verifiedAt;
    private Instant createdAt = Instant.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "enrollment_members", joinColumns = @JoinColumn(name = "enrollment_id"))
    private List<TeamMember> members = new ArrayList<>();
}
