package com.mangalmay.sports.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sports")
@Getter @Setter @NoArgsConstructor
public class Sport {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String category;

    private int fee;

    @Column(length = 60)
    private String teamSize;

    private int slots;

    @Column(length = 16)
    private String icon;

    @Column(length = 9)
    private String color;

    private Instant createdAt = Instant.now();
}
