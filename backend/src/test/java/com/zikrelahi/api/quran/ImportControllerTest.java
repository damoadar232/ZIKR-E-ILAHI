package com.zikrelahi.api.quran;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zikrelahi.api.admin.AdminRole;
import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.admin.AdminUserRepository;
import com.zikrelahi.api.auth.LoginRequest;
import com.zikrelahi.api.quran.ayah.AyahRepository;
import com.zikrelahi.api.quran.importer.AyahImportRow;
import com.zikrelahi.api.quran.importer.ImportRequest;
import com.zikrelahi.api.quran.translation.TranslationRepository;
import com.zikrelahi.api.quran.translator.TranslatorRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ImportControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AdminUserRepository adminUserRepository;
    @Autowired private AyahRepository ayahRepository;
    @Autowired private TranslationRepository translationRepository;
    @Autowired private TranslatorRepository translatorRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private static final String EMAIL    = "importtest@example.com";
    private static final String PASSWORD = "ImportTest123!";
    private String token;
    private Long translatorIdEn;

    @BeforeEach
    void setUp() throws Exception {
        translationRepository.deleteAll();
        ayahRepository.deleteAll();
        translatorRepository.deleteAll();
        adminUserRepository.deleteAll();

        adminUserRepository.save(AdminUser.builder()
                .email(EMAIL)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .displayName("Import Test Admin")
                .role(AdminRole.ADMIN)
                .enabled(true)
                .build());

        token = login();

        // Create an EN translator for use in import rows
        String trBody = objectMapper.writeValueAsString(Map.of(
                "name", "Test Translator EN", "languageCode", "en",
                "sourceRef", "Test source", "license", "Test license"));
        String resp = mockMvc.perform(post("/api/v1/admin/quran/translators")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(trBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        translatorIdEn = objectMapper.readTree(resp).path("data").path("id").asLong();
    }

    @AfterEach
    void tearDown() {
        translationRepository.deleteAll();
        ayahRepository.deleteAll();
        translatorRepository.deleteAll();
        adminUserRepository.deleteAll();
    }

    // ── Acceptance 1: validate with duplicate → 422 + DUPLICATE_AYAH ────────

    @Test
    void validateWithDuplicateReturns422() throws Exception {
        List<AyahImportRow> rows = List.of(
                row(2, 1, "arabic-1", null, null, null, null, null, null),
                row(2, 1, "duplicate", null, null, null, null, null, null));

        mockMvc.perform(post("/api/v1/admin/quran/import/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error", is("VALIDATION_FAILED")))
                .andExpect(jsonPath("$.data.errorCount", is(1)))
                .andExpect(jsonPath("$.data.errors[0].code", is("DUPLICATE_AYAH")));
    }

    // ── Acceptance 2: validate with valid 10 rows → 200, 0 errors ───────────

    @Test
    void validateWithValid10RowsReturns200() throws Exception {
        List<AyahImportRow> rows = buildValidFixture(10);

        mockMvc.perform(post("/api/v1/admin/quran/import/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRows", is(10)))
                .andExpect(jsonPath("$.data.validRows", is(10)))
                .andExpect(jsonPath("$.data.errorCount", is(0)))
                .andExpect(jsonPath("$.data.errors", hasSize(0)));
    }

    // ── Acceptance 3: commit with error rows → 422, DB unchanged ────────────

    @Test
    void commitWithErrorRowsReturns422AndDoesNotWrite() throws Exception {
        List<AyahImportRow> rows = List.of(
                row(2, 1, "arabic-1", null, null, null, null, null, null),
                row(2, 999, "out-of-bounds", null, null, null, null, null, null));

        long before = ayahRepository.count();

        mockMvc.perform(post("/api/v1/admin/quran/import/commit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.data.errors[0].code", is("AYAH_OUT_OF_BOUNDS")));

        // Database must be unchanged
        Assertions.assertEquals(before, ayahRepository.count(),
                "No Ayahs should have been written when validation fails.");
    }

    // ── Acceptance 4: commit with valid fixture → 200, 10 draft Ayahs ───────

    @Test
    void commitWithValidFixtureCreates10DraftAyahs() throws Exception {
        List<AyahImportRow> rows = buildValidFixture(10);

        mockMvc.perform(post("/api/v1/admin/quran/import/commit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imported", is(10)))
                .andExpect(jsonPath("$.data.updated", is(0)));

        // Verify all 10 Ayahs exist as DRAFT
        Assertions.assertEquals(10, ayahRepository.count(),
                "Exactly 10 Ayahs should have been created.");
    }

    // ── Additional coverage ─────────────────────────────────────────────────

    @Test
    void commitWithTranslationsCreatesTranslationRows() throws Exception {
        List<AyahImportRow> rows = List.of(
                row(2, 1, "arabic-1", "English text 1", null, null,
                        translatorIdEn, null, null));

        mockMvc.perform(post("/api/v1/admin/quran/import/commit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imported", is(1)))
                .andExpect(jsonPath("$.data.translationsCreated", is(1)));

        Assertions.assertEquals(1, translationRepository.count());
    }

    @Test
    void validateDetectsMissingArabicAndTranslations() throws Exception {
        List<AyahImportRow> rows = List.of(
                row(2, 1, null, null, null, null, null, null, null));

        mockMvc.perform(post("/api/v1/admin/quran/import/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.data.errors[0].code", is("MISSING_CONTENT")));
    }

    @Test
    void validateDetectsInvalidSurahNumber() throws Exception {
        List<AyahImportRow> rows = List.of(
                row(0, 1, "arabic", null, null, null, null, null, null));

        mockMvc.perform(post("/api/v1/admin/quran/import/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.data.errors[0].code", is("INVALID_SURAH")));
    }

    @Test
    void validateDetectsUnknownTranslator() throws Exception {
        List<AyahImportRow> rows = List.of(
                row(2, 1, "arabic", "English text", null, null,
                        99999L, null, null));

        mockMvc.perform(post("/api/v1/admin/quran/import/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.data.errors[0].code", is("UNKNOWN_TRANSLATOR")));
    }

    @Test
    void importWithoutTokenReturns401() throws Exception {
        List<AyahImportRow> rows = buildValidFixture(2);

        mockMvc.perform(post("/api/v1/admin/quran/import/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void commitPreservesExistingPublishedAyahStatus() throws Exception {
        // Pre-create an Ayah and publish it
        mockMvc.perform(post("/api/v1/admin/quran/ayahs")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "surahNumber", 2, "ayahNumber", 1,
                                "arabicText", "original"))))
                .andExpect(status().isCreated());

        mockMvc.perform(patch("/api/v1/admin/quran/ayahs/2/1/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk());

        // Import with updated text for the same Ayah
        List<AyahImportRow> rows = List.of(
                row(2, 1, "updated arabic", null, null, null, null, null, null));

        mockMvc.perform(post("/api/v1/admin/quran/import/commit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrap(rows)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imported", is(0)))
                .andExpect(jsonPath("$.data.updated", is(1)));

        // Verify the Ayah is still PUBLISHED after import
        mockMvc.perform(patch("/api/v1/admin/quran/ayahs/2/1/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk());

        // Verify text was updated
        var ayah = ayahRepository
                .findByIdSurahNumberAndIdAyahNumber((short) 2, (short) 1)
                .orElseThrow();
        Assertions.assertEquals("updated arabic", ayah.getArabicText());
        Assertions.assertEquals(com.zikrelahi.api.common.ContentStatus.PUBLISHED,
                ayah.getStatus());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Builds a valid import fixture: N Ayahs from Surah 2 (Al-Baqarah),
     * each with Arabic text only (no translations).
     */
    private List<AyahImportRow> buildValidFixture(int count) {
        List<AyahImportRow> rows = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            rows.add(row(2, i, "arabic-text-" + i,
                    null, null, null, null, null, null));
        }
        return rows;
    }

    private AyahImportRow row(int surah, int ayah, String arabic,
                              String en, String hi, String ur,
                              Long trEn, Long trHi, Long trUr) {
        return new AyahImportRow(surah, ayah, arabic, en, hi, ur, trEn, trHi, trUr);
    }

    private String wrap(List<AyahImportRow> rows) throws Exception {
        return objectMapper.writeValueAsString(new ImportRequest(rows));
    }

    private String login() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).path("data").path("accessToken").asText();
    }
}
