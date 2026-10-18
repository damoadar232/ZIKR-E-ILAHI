package com.zikrelahi.api.quran.translator;

public record TranslatorDto(
        Long id,
        String name,
        String languageCode,
        String sourceRef,
        String license) {

    public static TranslatorDto from(Translator t) {
        return new TranslatorDto(
                t.getId(),
                t.getName(),
                t.getLanguageCode().name(),
                t.getSourceRef(),
                t.getLicense());
    }
}
