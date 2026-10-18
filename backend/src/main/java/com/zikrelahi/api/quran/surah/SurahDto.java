package com.zikrelahi.api.quran.surah;

/**
 * Public read-only projection of a Surah.
 * Returned by public GET endpoints — never exposes internal status for
 * non-admin callers (all public results are PUBLISHED by query contract).
 */
public record SurahDto(
        int number,
        String arabicName,
        String transliterated,
        String englishMeaning,
        int ayahCount,
        String revelation,
        int revelationOrder) {

    public static SurahDto from(Surah surah) {
        return new SurahDto(
                surah.getNumber(),
                surah.getArabicName(),
                surah.getTransliterated(),
                surah.getEnglishMeaning(),
                surah.getAyahCount(),
                surah.getRevelation().name(),
                surah.getRevelationOrder());
    }
}
