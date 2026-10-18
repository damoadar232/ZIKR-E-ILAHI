package com.zikrelahi.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zikrelahi.api.admin.AdminRole;
import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.admin.AdminUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AdminUserRepository adminUserRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private static final String TEST_EMAIL    = "testadmin@example.com";
    private static final String TEST_PASSWORD = "SecurePassword123!";

    @BeforeEach
    void setUp() {
        adminUserRepository.deleteAll();
        AdminUser admin = AdminUser.builder()
                .email(TEST_EMAIL)
                .passwordHash(passwordEncoder.encode(TEST_PASSWORD))
                .displayName("Test Admin")
                .role(AdminRole.ADMIN)
                .enabled(true)
                .build();
        adminUserRepository.save(admin);
    }

    @AfterEach
    void tearDown() {
        adminUserRepository.deleteAll();
    }

    @Test
    void loginWithValidCredentialsReturns200AndToken() throws Exception {
        LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.expiresIn", is(3600)))
                .andExpect(jsonPath("$.data.role", is("ADMIN")))
                .andExpect(jsonPath("$.data.displayName", is("Test Admin")));
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        LoginRequest request = new LoginRequest(TEST_EMAIL, "WrongPassword!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("INVALID_CREDENTIALS")));
    }

    @Test
    void loginWithUnknownEmailReturns401() throws Exception {
        LoginRequest request = new LoginRequest("nobody@example.com", TEST_PASSWORD);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/quran/ayahs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointWithValidTokenReturns200() throws Exception {
        String token = loginAndGetToken();
        mockMvc.perform(get("/api/v1/admin/quran/ayahs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()));
    }

    @Test
    void adminEndpointWithMalformedTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/quran/ayahs")
                        .header("Authorization", "Bearer not-a-real-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthEndpointIsPublicAndReturnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    void refreshWithValidTokenReturnsNewAccessToken() throws Exception {
        String refreshToken = loginAndGetRefreshToken();
        RefreshRequest refreshRequest = new RefreshRequest(refreshToken);
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()));
    }

    @Test
    void refreshWithInvalidTokenReturns401() throws Exception {
        RefreshRequest refreshRequest = new RefreshRequest("completely-invalid-token");
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithMissingEmailReturns400() throws Exception {
        String badJson = "{\"password\":\"SomePassword123!\"}";
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("VALIDATION_ERROR")));
    }

    @Test
    void logoutWithValidTokenReturns204() throws Exception {
        String token = loginAndGetToken();
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    private String loginAndGetToken() throws Exception {
        LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD);
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).path("data").path("accessToken").asText();
    }

    private String loginAndGetRefreshToken() throws Exception {
        LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD);
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).path("data").path("refreshToken").asText();
    }
}
