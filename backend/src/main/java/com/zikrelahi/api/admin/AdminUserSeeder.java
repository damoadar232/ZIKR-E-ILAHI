package com.zikrelahi.api.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() == 0) {
            AdminUser admin = AdminUser.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .displayName("Default Admin")
                    .role(AdminRole.ADMIN)
                    .enabled(true)
                    .build();
            repository.save(admin);
            log.info("Seeded default admin account: {}", adminEmail);
            log.warn("IMPORTANT: Change the default admin password before deploying to production.");
        }
    }
}
