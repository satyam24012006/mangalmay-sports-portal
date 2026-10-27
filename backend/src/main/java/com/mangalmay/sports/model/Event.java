package com.mangalmay.sports.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "events")
@Getter @Setter @NoArgsConstructor
public class Event {
    public static final String OPEN = "Registration open";

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    private LocalDate eventDate;

    @Column(length = 150)
    private String venue;

    @Column(length = 40)
    private String status;

    @Column(length = 500)
    private String description;

    private Instant createdAt = Instant.now();

    public boolean isOpen() { return OPEN.equals(status); }
}
