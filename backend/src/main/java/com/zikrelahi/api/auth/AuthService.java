package com.zikrelahi.api.auth;

import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.admin.AdminUserRepository;
import com.zikrelahi.api.common.UnauthorizedException;
import com.zikrelahi.api.security.AdminUserDetails;
import com.zikrelahi.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public LoginResponse login(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        AdminUserDetails details = (AdminUserDetails) authentication.getPrincipal();
        AdminUser user = details.getAdminUser();

        String accessToken = tokenProvider.generateAccessToken(
                user.getEmail(), user.getRole().name(), user.getId());
        String rawRefreshToken = tokenProvider.generateOpaqueRefreshToken();

        user.setRefreshTokenHash(passwordEncoder.encode(rawRefreshToken));
        adminUserRepository.save(user);

        return new LoginResponse(
                accessToken,
                rawRefreshToken,
                tokenProvider.getAccessExpirySeconds(),
                user.getRole().name(),
                user.getDisplayName());
    }

    @Transactional
    public LoginResponse refresh(String rawRefreshToken) {
        AdminUser user = adminUserRepository.findAll().stream()
                .filter(u -> u.getRefreshTokenHash() != null
                        && passwordEncoder.matches(rawRefreshToken, u.getRefreshTokenHash()))
                .findFirst()
                .orElseThrow(() ->
                        new UnauthorizedException("Refresh token is invalid or expired."));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("This administrator account is disabled.");
        }

        String newAccessToken = tokenProvider.generateAccessToken(
                user.getEmail(), user.getRole().name(), user.getId());
        String newRawRefreshToken = tokenProvider.generateOpaqueRefreshToken();

        user.setRefreshTokenHash(passwordEncoder.encode(newRawRefreshToken));
        adminUserRepository.save(user);

        return new LoginResponse(
                newAccessToken,
                newRawRefreshToken,
                tokenProvider.getAccessExpirySeconds(),
                user.getRole().name(),
                user.getDisplayName());
    }

    @Transactional
    public void logout(String email) {
        adminUserRepository.findByEmail(email).ifPresent(user -> {
            user.setRefreshTokenHash(null);
            adminUserRepository.save(user);
        });
    }
}
