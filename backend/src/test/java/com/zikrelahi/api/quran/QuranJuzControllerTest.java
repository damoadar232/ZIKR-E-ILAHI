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
class QuranJuzControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Acceptance criteria ──────────────────────────────────────────────────

    @Test
    void listJuzReturns30Records() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(30)));
    }

    // ── Start boundaries from juzStarts in quranData.ts ─────────────────────

    @Test
    void juz1StartsAtSurah1Ayah1() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.number",     is(1)))
                .andExpect(jsonPath("$.data.startSurah", is(1)))
                .andExpect(jsonPath("$.data.startAyah",  is(1)))
                .andExpect(jsonPath("$.data.startRef",   is("1:1")));
    }

    @Test
    void juz2StartsAtSurah2Ayah142() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.startSurah", is(2)))
                .andExpect(jsonPath("$.data.startAyah",  is(142)))
                .andExpect(jsonPath("$.data.startRef",   is("2:142")));
    }

    @Test
    void juz30StartsAtSurah78Ayah1() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.startSurah", is(78)))
                .andExpect(jsonPath("$.data.startAyah",  is(1)))
                .andExpect(jsonPath("$.data.startRef",   is("78:1")));
    }

    @Test
    void juz30EndsAtSurah114Ayah6() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.endSurah", is(114)))
                .andExpect(jsonPath("$.data.endAyah",  is(6)))
                .andExpect(jsonPath("$.data.endRef",   is("114:6")));
    }

    @Test
    void juzListIsOrderedByNumber() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].number",  is(1)))
                .andExpect(jsonPath("$.data[29].number", is(30)));
    }

    @Test
    void juzHasArabicName() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.arabicName", not(emptyOrNullString())));
    }

    // ── Spot-check several Juz start positions from juzStarts ───────────────

    @Test
    void juz10StartsAtSurah8Ayah41() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.startSurah", is(8)))
                .andExpect(jsonPath("$.data.startAyah",  is(41)));
    }

    @Test
    void juz15StartsAtSurah17Ayah1() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.startSurah", is(17)))
                .andExpect(jsonPath("$.data.startAyah",  is(1)));
    }

    @Test
    void juz29StartsAtSurah67Ayah1() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/29"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.startSurah", is(67)))
                .andExpect(jsonPath("$.data.startAyah",  is(1)));
    }

    // ── Error cases ──────────────────────────────────────────────────────────

    @Test
    void juz31Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/31"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }

    @Test
    void juz0Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz/0"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }

    @Test
    void juzEndpointIsPublicNoTokenRequired() throws Exception {
        mockMvc.perform(get("/api/v1/quran/juz"))
                .andExpect(status().isOk());
    }
}
