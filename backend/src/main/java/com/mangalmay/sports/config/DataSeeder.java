package com.mangalmay.sports.config;

import com.mangalmay.sports.model.*;
import com.mangalmay.sports.repo.*;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
public class DataSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final SportRepository sports;
    private final EventRepository events;
    private final PasswordEncoder encoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataSeeder(UserRepository users, SportRepository sports, EventRepository events, PasswordEncoder encoder,
                      @Value("${app.admin-email}") String adminEmail,
                      @Value("${app.admin-password}") String adminPassword) {
        this.users = users;
        this.sports = sports;
        this.events = events;
        this.encoder = encoder;
        this.adminEmail = adminEmail.trim().toLowerCase();
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdmin();
        if (sports.count() == 0) seedSports();
        if (events.count() == 0) seedEvents();
    }

    private void seedAdmin() {
        if (users.existsByEmailIgnoreCase(adminEmail)) return;
        String pw = adminPassword;
        boolean generated = pw == null || pw.isBlank();
        if (generated) pw = randomPassword();
        if (pw.length() < 8) throw new IllegalStateException("ADMIN_PASSWORD must be at least 8 characters");
        User admin = new User();
        admin.setName("Sports Administrator");
        admin.setEmail(adminEmail);
        admin.setPasswordHash(encoder.encode(pw));
        admin.setRole(Role.ADMIN);
        users.save(admin);
        if (generated) {
            log.warn("==================================================================");
            log.warn(" Admin account created: {}", adminEmail);
            log.warn(" Generated password (shown ONCE, save it now): {}", pw);
            log.warn("==================================================================");
        } else {
            log.info("Admin account created: {}", adminEmail);
        }
    }

    private void seedSports() {
        Object[][] rows = {
            {"Football", "TEAM SPORT", 1500, "11 players", 8, "⚽", "#c7ff4d"},
            {"Basketball", "TEAM SPORT", 1200, "5 players", 12, "🏀", "#ff9d62"},
            {"Badminton", "RACKET SPORT", 500, "Singles / Doubles", 24, "🏸", "#a58bff"},
            {"Cricket", "TEAM SPORT", 2000, "11 players", 6, "🏏", "#5ce1d6"},
            {"Table Tennis", "RACKET SPORT", 400, "Singles / Doubles", 20, "🏓", "#ff6b9d"},
            {"Volleyball", "TEAM SPORT", 1000, "6 players", 10, "🏐", "#78b8ff"},
        };
        Instant base = Instant.now();
        for (int i = 0; i < rows.length; i++) {
            Sport s = new Sport();
            s.setName((String) rows[i][0]);
            s.setCategory((String) rows[i][1]);
            s.setFee((Integer) rows[i][2]);
            s.setTeamSize((String) rows[i][3]);
            s.setSlots((Integer) rows[i][4]);
            s.setIcon((String) rows[i][5]);
            s.setColor((String) rows[i][6]);
            s.setCreatedAt(base.plusMillis(i));
            sports.save(s);
        }
    }

    private void seedEvents() {
        Event a = new Event();
        a.setName("MANGALMAY SPORTS FEST 2026");
        a.setEventDate(LocalDate.of(2026, 11, 14));
        a.setVenue("Main Sports Complex");
        a.setStatus("Registration open");
        a.setDescription("One campus. Every game. Your moment.");
        events.save(a);

        Event b = new Event();
        b.setName("INTER-COLLEGE CHAMPIONSHIP");
        b.setEventDate(LocalDate.of(2026, 11, 28));
        b.setVenue("Mangalmay Campus");
        b.setStatus("Coming soon");
        b.setDescription("Represent your college. Make it count.");
        events.save(b);
    }

    private static String randomPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 16; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
        return sb.toString();
    }
}
