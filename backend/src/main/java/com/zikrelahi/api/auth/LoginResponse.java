package com.zikrelahi.api.auth;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        String role,
        String displayName) {}
