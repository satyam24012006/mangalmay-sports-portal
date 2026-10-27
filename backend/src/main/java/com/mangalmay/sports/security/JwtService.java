package com.mangalmay.sports.security;

import com.mangalmay.sports.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expiryMs;

    public JwtService(@Value("${app.jwt-secret}") String secret,
                      @Value("${app.jwt-expiry-hours}") long hours) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("app.jwt-secret (JWT_SECRET) must be at least 32 characters");
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expiryMs = hours * 3_600_000L;
    }

    public String create(User u) {
        Date now = new Date();
        return Jwts.builder()
                .subject(u.getId().toString())
                .claim("role", u.getRole().name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMs))
                .signWith(key)
                .compact();
    }

    /** Returns the user id if the token is valid and unexpired. */
    public Optional<UUID> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(UUID.fromString(c.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
