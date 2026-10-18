package com.zikrelahi.api.quran.translator;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record TranslatorRequest(
        @NotBlank(message = "Translator name is required.")
        String name,

        @NotNull(message = "Language code is required.")
        @Pattern(regexp = "en|hi|ur", message = "Language code must be en, hi, or ur.")
        String languageCode,

        @NotBlank(message = "Source reference is required.")
        String sourceRef,

        @NotBlank(message = "License is required.")
        String license,

        String licenseNotes) {}
