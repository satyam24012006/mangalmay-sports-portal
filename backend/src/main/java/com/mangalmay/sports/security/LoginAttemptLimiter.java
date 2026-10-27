package com.mangalmay.sports.security;

import com.mangalmay.sports.web.ApiException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Blocks brute-force logins: 5 failures per (ip + email) within 15 minutes. In-memory, resets on restart. */
@Component
public class LoginAttemptLimiter {
    private static final int MAX = 5;
    private static final long WINDOW_MS = 15 * 60 * 1000L;
    private final Map<String, long[]> attempts = new ConcurrentHashMap<>();   // key -> {count, windowStart}

    public void check(String key) {
        long[] a = attempts.get(key);
        if (a != null && a[0] >= MAX && System.currentTimeMillis() - a[1] < WINDOW_MS) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in a few minutes.");
        }
    }

    public void fail(String key) {
        attempts.compute(key, (k, a) -> {
            long now = System.currentTimeMillis();
            if (a == null || now - a[1] >= WINDOW_MS) return new long[]{1, now};
            a[0]++;
            return a;
        });
    }

    public void reset(String key) { attempts.remove(key); }
}
