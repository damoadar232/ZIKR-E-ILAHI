package com.zikrelahi.api.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private final JwtTokenProvider provider = new JwtTokenProvider(
            "test-secret-long-enough-for-hmac-sha256-minimum-32-bytes-padded-here",
            3600L,
            2592000L);

    @Test
    void generatedTokenIsValidAndContainsEmail() {
        String token = provider.generateAccessToken("test@example.com", "ADMIN", 1L);

        assertThat(provider.validateAccessToken(token)).isTrue();
        assertThat(provider.getEmailFromToken(token)).isEqualTo("test@example.com");
    }

    @Test
    void tamperedTokenFailsValidation() {
        String token = provider.generateAccessToken("test@example.com", "ADMIN", 1L);

        assertThat(provider.validateAccessToken(token + "tampered")).isFalse();
    }

    @Test
    void completelyInvalidStringFailsValidation() {
        assertThat(provider.validateAccessToken("not.a.jwt")).isFalse();
        assertThat(provider.validateAccessToken("")).isFalse();
    }

    @Test
    void refreshTokensAreOpaqueAndUnique() {
        String first = provider.generateOpaqueRefreshToken();
        String second = provider.generateOpaqueRefreshToken();

        assertThat(first).isNotEqualTo(second);
        assertThat(first).hasSize(64);
        assertThat(first).matches("[a-f0-9]+");
    }

    @Test
    void accessExpiryIsReportedCorrectly() {
        assertThat(provider.getAccessExpirySeconds()).isEqualTo(3600L);
    }
}
