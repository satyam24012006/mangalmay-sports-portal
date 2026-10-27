package com.mangalmay.sports.web;

import com.mangalmay.sports.dto.Dtos.*;
import com.mangalmay.sports.dto.Mapper;
import com.mangalmay.sports.model.User;
import com.mangalmay.sports.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest r) { return auth.signup(r); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r, HttpServletRequest req) {
        return auth.login(r, req.getRemoteAddr());
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal User me) { return Mapper.user(me, null); }
}
