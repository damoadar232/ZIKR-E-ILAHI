package com.zikrelahi.api.quran.importer;

/**
 * One row in a bulk import payload.
 * Arabic and each translation are independently optional — a row may carry
 * Arabic only, Arabic + one translation, or Arabic + all three translations.
 * If a translation field is non-null and non-blank, the matching translatorId
 * must reference a valid Translator with the corresponding language_code.
 */
public record AyahImportRow(
        Integer surahNumber,
        Integer ayahNumber,
        String arabicText,
        String translationEn,
        String translationHi,
        String translationUr,
        Long translatorIdEn,
        Long translatorIdHi,
        Long translatorIdUr) {}
