package com.zikrelahi.api.quran.ayah;

import com.zikrelahi.api.quran.translation.Translation;

/**
 * Public reader DTO — no status field, combines Arabic text with one translation.
 * Shape matches quranApiService.ts ApiAyah:
 *   { surahNumber, ayahNumber, arabicText, translation: { languageCode, text, translatorName } }
 *
 * arabicText comes from the Ayah row and must be passed in explicitly because
 * Translation no longer holds a JPA association to Ayah.
 */
public record PublicAyahDto(
        int surahNumber,
        int ayahNumber,
        String arabicText,
        TranslationInfo translation) {

    public record TranslationInfo(
            String languageCode,
            String text,
            String translatorName) {}

    /**
     * Build from a Translation row plus the arabic text fetched by the repository query.
     * Translator must already be loaded (JOIN FETCH in the query).
     */
    public static PublicAyahDto from(Translation t, String arabicText) {
        return new PublicAyahDto(
                t.getSurahNumber(),
                t.getAyahNumber(),
                arabicText,
                new TranslationInfo(
                        t.getLanguageCode().name(),
                        t.getText(),
                        t.getTranslator().getName()));
    }
}
