package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zikrelahi.api.admin.AdminRole;
import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.admin.AdminUserRepository;
import com.zikrelahi.api.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LyricsApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private AdminUserRepository adminUserRepository;
    @Autowired
    private LyricRepository lyricRepository;
    @Autowired
    private LyricLanguageVersionRepository languageVersionRepository;
    @Autowired
    private LyricRevisionRepository revisionRepository;
    @Autowired
    private JwtTokenProvider tokenProvider;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String prefix;
    private AdminUser admin;
    private String token;

    @BeforeEach
    void setUp() {
        prefix = "api-test-" + UUID.randomUUID().toString().substring(0, 8);
        admin = adminUserRepository.saveAndFlush(AdminUser.builder()
                .email(prefix + "@example.test")
                .passwordHash("not-used-by-bearer-tests")
                .displayName("Lyrics API Test Admin")
                .role(AdminRole.ADMIN)
                .enabled(true)
                .build());
        token = tokenProvider.generateAccessToken(admin.getEmail(), admin.getRole().name(), admin.getId());
    }

    @AfterEach
    void cleanUp() {
        List<Lyric> created = lyricRepository.findAll().stream()
                .filter(lyric -> lyric.getLegacyId().startsWith(prefix)).toList();
        for (Lyric lyric : created) {
            jdbcTemplate.update("DELETE FROM lyric_revisions WHERE lyric_id = ?", lyric.getId());
            jdbcTemplate.update("DELETE FROM lyric_language_versions WHERE lyric_id = ?", lyric.getId());
            lyricRepository.delete(lyric);
        }
        if (admin != null)
            adminUserRepository.deleteById(admin.getId());
    }

    @Test
    void adminCrudPublishesOnlyApprovedLanguageAndFiltersPublicList() throws Exception {
        String reference = createLyric("Naat API Test", "poet-test", "Reciter Test");
        mockMvc.perform(get("/api/v1/lyrics/{id}", reference))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Mercy first")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.languageVersions[0].languageCode", is("roman")))
                .andExpect(jsonPath("$.data.languageVersions[0].status", is("DRAFT")));

        mockMvc.perform(patch("/api/v1/admin/lyrics/{id}/languages/roman/status", reference)
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content(statusBody("PUBLISHED")))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/admin/lyrics/{id}/status", reference)
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content(statusBody("PUBLISHED")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/lyrics/{id}", reference))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("Naat API Test")))
                .andExpect(jsonPath("$.data.languageVersions", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.data.languageVersions[0].code", is("roman")))
                .andExpect(jsonPath("$.data.languageVersions[0].status").doesNotExist())
                .andExpect(jsonPath("$.data.createdBy").doesNotExist());

        mockMvc.perform(get("/api/v1/lyrics")
                .param("page", "0").param("size", "10")
                .param("category", "naat-sharif")
                .param("reciter", "reciter")
                .param("poet", "poet-test")
                .param("language", "roman"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id", is(reference)))
                .andExpect(jsonPath("$.data.totalElements", is(1)));
    }

    @Test
    void languageUpdatesAreIndependentAndCreatePriorContentRevisions() throws Exception {
        String reference = createLyric("Independent versions", "poet-isolated", "Reciter Isolated");
        String firstSave = mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Roman prior")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long romanVersion = objectMapper.readTree(firstSave).at("/data/languageVersions/0/rowVersion").asLong();
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/hi", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("हिंदी पाठ")))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Roman revised", romanVersion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.languageVersions", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$.data.languageVersions[0].languageCode", is("hi")))
                .andExpect(jsonPath("$.data.languageVersions[0].plainText", is("हिंदी पाठ")))
                .andExpect(jsonPath("$.data.languageVersions[1].languageCode", is("roman")))
                .andExpect(jsonPath("$.data.languageVersions[1].plainText", is("Roman revised")));

        mockMvc.perform(get("/api/v1/admin/lyrics/{id}/languages/roman/revisions", reference)
                .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].plainText", is("Roman prior")))
                .andExpect(jsonPath("$.data[0].revisionNumber", is(1)));
    }

    @Test
    void editingOnlyPublishedLanguageDemotesTheLyricAndHidesItFromPublicReads() throws Exception {
        String reference = createLyric("Draft on edit", "poet-edit", "Reciter Edit");
        long publishedVersion = saveAndPublishRoman(reference);

        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Needs review", publishedVersion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andExpect(jsonPath("$.data.languageVersions[0].status", is("DRAFT")));

        mockMvc.perform(get("/api/v1/lyrics/{id}", reference))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicationRequiresPublishedLanguageAndUnsupportedApiLanguageIsRejected() throws Exception {
        String reference = createLyric("Publish rule", "poet-publish", "Reciter Publish");
        mockMvc.perform(patch("/api/v1/admin/lyrics/{id}/status", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(statusBody("PUBLISHED")))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/en", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Not an API language")))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(0, languageVersionRepository.count());
    }

    @Test
    void rejectsUnsafeDocumentsAndDoesNotPersistThem() throws Exception {
        String reference = createLyric("Validator route", "poet-validator", "Reciter Validator");
        String invalid = "{\"document\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{" +
                "\"type\":\"text\",\"text\":\"bad\",\"marks\":[{\"type\":\"textStyle\",\"attrs\":{\"fontFamily\":\"Comic Sans\"}}]}]}]}}";
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(invalid))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(0,
                languageVersionRepository.findAllByLyric_IdOrderByLanguageCode(
                        lyricRepository.findByLegacyId(reference).orElseThrow().getId()).size());
    }

    @Test
    void staleLanguageVersionReturnsConflictWithoutOverwritingServerDocument() throws Exception {
        String reference = createLyric("Concurrent edit", "poet-concurrent", "Reciter Concurrent");
        String initialSave = mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Server original")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long expectedVersion = objectMapper.readTree(initialSave).at("/data/languageVersions/0/rowVersion").asLong();
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Concurrent server update", expectedVersion)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Stale browser update", expectedVersion)))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/v1/admin/lyrics/{id}", reference).header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.languageVersions[0].plainText", is("Concurrent server update")));
    }

    @Test
    void unauthorizedAndInsufficientRoleRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/v1/admin/lyrics"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data").value(nullValue()));
        mockMvc.perform(get("/api/v1/admin/lyrics")
                .with(SecurityMockMvcRequestPostProcessors.user("viewer").roles("VIEWER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("FORBIDDEN")));
    }

    @Test
    void missingLyricsReturnNotFoundAndDeleteRefusesVersionHistory() throws Exception {
        mockMvc.perform(get("/api/v1/admin/lyrics/{id}", prefix + "-missing")
                .header("Authorization", bearer()))
                .andExpect(status().isNotFound());

        String empty = createLyric("Delete empty draft", "poet-delete", "Reciter Delete");
        mockMvc.perform(delete("/api/v1/admin/lyrics/{id}", empty).header("Authorization", bearer()))
                .andExpect(status().isNoContent());

        String withContent = createLyric("Keep history", "poet-history", "Reciter History");
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", withContent)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Keep this snapshot")))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/admin/lyrics/{id}", withContent).header("Authorization", bearer()))
                .andExpect(status().isConflict());
    }

    @Test
    void oversizedLyricsJsonBodyReturns413() throws Exception {
        String reference = createLyric("Payload limit", "poet-size", "Reciter Size");
        String body = "{\"document\":{\"type\":\"doc\",\"content\":[]},\"changeNote\":\""
                + "x".repeat(520 * 1024) + "\"}";
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.error", is("PAYLOAD_TOO_LARGE")));
    }

    private String createLyric(String title, String poet, String reciter) throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("legacyId", prefix + "-" + poet);
        request.put("title", title);
        request.put("slug", prefix + "-" + poet);
        request.put("writerId", poet);
        request.put("writerName", "API Test Poet");
        request.put("categoryIds", List.of("naat-sharif"));
        request.put("subjectIds", List.of("madina"));
        request.put("reciters", List.of(reciter));
        request.put("artistIds", List.of("test-artist"));
        request.put("tags", List.of("api-test"));
        String response = mockMvc.perform(post("/api/v1/admin/lyrics")
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode data = objectMapper.readTree(response).path("data");
        return data.path("legacyId").asText();
    }

    private long saveAndPublishRoman(String reference) throws Exception {
        mockMvc.perform(put("/api/v1/admin/lyrics/{id}/languages/roman", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(languageBody("Published line")))
                .andExpect(status().isOk());
        String publishedResponse = mockMvc.perform(patch("/api/v1/admin/lyrics/{id}/languages/roman/status", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(statusBody("PUBLISHED")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        mockMvc.perform(patch("/api/v1/admin/lyrics/{id}/status", reference)
                .header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content(statusBody("PUBLISHED")))
                .andExpect(status().isOk());
        return objectMapper.readTree(publishedResponse).at("/data/languageVersions/0/rowVersion").asLong();
    }

    private String languageBody(String text) throws Exception {
        return languageBody(text, null);
    }

    private String languageBody(String text, Long expectedRowVersion) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("document", Map.of("type", "doc", "content", List.of(
                Map.of("type", "paragraph", "content", List.of(Map.of("type", "text", "text", text))))));
        if (expectedRowVersion != null)
            body.put("expectedRowVersion", expectedRowVersion);
        return objectMapper.writeValueAsString(body);
    }

    private String statusBody(String status) throws Exception {
        return objectMapper.writeValueAsString(Map.of("status", status));
    }

    private String bearer() {
        return "Bearer " + token;
    }
}