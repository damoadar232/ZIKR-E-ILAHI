package com.zikrelahi.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long accessExpiryMs;
    private final long refreshExpiryMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiry-seconds}") long accessExpirySec,
            @Value("${app.jwt.refresh-expiry-seconds}") long refreshExpirySec) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpiryMs = accessExpirySec * 1000L;
        this.refreshExpiryMs = refreshExpirySec * 1000L;
    }

    public String generateAccessToken(String email, String role, Long adminId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpiryMs);
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("adminId", adminId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String generateOpaqueRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateAccessToken(String token) {
        try {
            parseAccessToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid JWT: {}", ex.getMessage());
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return parseAccessToken(token).getSubject();
    }

    public long getAccessExpirySeconds() {
        return accessExpiryMs / 1000L;
    }
}
