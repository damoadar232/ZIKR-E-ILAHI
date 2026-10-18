package com.zikrelahi.api.quran;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class QuranSurahControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Acceptance criteria ──────────────────────────────────────────────────

    @Test
    void allSurahsReturns114Records() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(114)));
    }

    @Test
    void makkiFilterReturns86Records() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs").param("revelation", "Makki"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(86)));
    }

    @Test
    void madaniFilterReturns28Records() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs").param("revelation", "Madani"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(28)));
    }

    // ── Data integrity ───────────────────────────────────────────────────────

    @Test
    void makkiAndMadaniSumTo114() throws Exception {
        // If both filters return 86 + 28 = 114 the total is consistent.
        // Verified independently by the two tests above; this test asserts the
        // response shapes are non-empty and the totals are logically consistent.
        mockMvc.perform(get("/api/v1/quran/surahs").param("revelation", "Makki"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(86)));
        mockMvc.perform(get("/api/v1/quran/surahs").param("revelation", "Madani"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(28)));
    }

    @Test
    void firstSurahIsAlFatihah() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.number",          is(1)))
                .andExpect(jsonPath("$.data.transliterated",  is("Al-Fatihah")))
                .andExpect(jsonPath("$.data.arabicName",      is("الفاتحة")))
                .andExpect(jsonPath("$.data.ayahCount",       is(7)))
                .andExpect(jsonPath("$.data.revelation",      is("Makki")))
                .andExpect(jsonPath("$.data.revelationOrder", is(5)))
                .andExpect(jsonPath("$.data.englishMeaning",  is("The Opening")));
    }

    @Test
    void lastSurahIsAnNas() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs/114"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.number",         is(114)))
                .andExpect(jsonPath("$.data.transliterated", is("An-Nas")))
                .andExpect(jsonPath("$.data.ayahCount",      is(6)))
                .andExpect(jsonPath("$.data.revelation",     is("Makki")));
    }

    @Test
    void alBaqarahIsMadani() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.transliterated", is("Al-Baqarah")))
                .andExpect(jsonPath("$.data.ayahCount",      is(286)))
                .andExpect(jsonPath("$.data.revelation",     is("Madani")));
    }

    @Test
    void surahsAreOrderedByCanonicalNumber() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].number",   is(1)))
                .andExpect(jsonPath("$.data[113].number", is(114)));
    }

    @Test
    void invalidSurahNumberReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs/115"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }

    @Test
    void surahZeroReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs/0"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }

    @Test
    void invalidRevelationParamReturns400() throws Exception {
        mockMvc.perform(get("/api/v1/quran/surahs").param("revelation", "Mekki"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_PARAMETER")));
    }

    @Test
    void surahEndpointIsPublicNoTokenRequired() throws Exception {
        // No Authorization header — must still return 200.
        mockMvc.perform(get("/api/v1/quran/surahs"))
                .andExpect(status().isOk());
    }
}
