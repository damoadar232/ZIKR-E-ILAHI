package com.zikrelahi.api.quran.ayah;

import jakarta.validation.constraints.*;

public record AyahRequest(
        @NotNull(message = "Surah number is required.")
        @Min(value = 1, message = "Surah number must be between 1 and 114.")
        @Max(value = 114, message = "Surah number must be between 1 and 114.")
        Integer surahNumber,

        @NotNull(message = "Ayah number is required.")
        @Min(value = 1, message = "Ayah number must be at least 1.")
        Integer ayahNumber,

        @NotBlank(message = "Arabic text is required.")
        String arabicText) {}
