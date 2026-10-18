package com.zikrelahi.api.quran.translation;

public record TranslationDto(
        Long id,
        int surahNumber,
        int ayahNumber,
        String languageCode,
        String text,
        Long translatorId,
        String translatorName,
        String status) {

    public static TranslationDto from(Translation t) {
        return new TranslationDto(
                t.getId(),
                t.getSurahNumber(),
                t.getAyahNumber(),
                t.getLanguageCode().name(),
                t.getText(),
                t.getTranslator().getId(),
                t.getTranslator().getName(),
                t.getStatus().name());
    }
}
