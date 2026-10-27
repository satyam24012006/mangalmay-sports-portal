package com.mangalmay.sports.service;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.dto.Mapper;
import com.mangalmay.sports.model.Role;
import com.mangalmay.sports.model.User;
import com.mangalmay.sports.repo.UserRepository;
import com.mangalmay.sports.security.JwtService;
import com.mangalmay.sports.security.LoginAttemptLimiter;
import com.mangalmay.sports.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final LoginAttemptLimiter limiter;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, LoginAttemptLimiter limiter) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.limiter = limiter;
    }

    @Transactional
    public AuthResponse signup(SignupRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists.");
        }
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setCollege(r.college() == null ? null : r.college().trim());
        u.setRole(Role.STUDENT);
        users.save(u);
        return new AuthResponse(jwt.create(u), Mapper.user(u, null));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest r, String clientIp) {
        String email = r.email().trim().toLowerCase();
        String key = clientIp + "|" + email;
        limiter.check(key);
        User u = users.findByEmailIgnoreCase(email)
                .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
                .orElse(null);
        if (u == null) {
            limiter.fail(key);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Account not found or password is incorrect.");
        }
        limiter.reset(key);
        return new AuthResponse(jwt.create(u), Mapper.user(u, null));
    }
}
