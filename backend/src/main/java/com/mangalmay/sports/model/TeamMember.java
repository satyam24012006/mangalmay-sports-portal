package com.mangalmay.sports.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter @Setter @NoArgsConstructor
public class TeamMember {
    private String name;
    private String phone;

    public TeamMember(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }
}
