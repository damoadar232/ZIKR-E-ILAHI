package com.zikrelahi.api.quran.translation;

import com.zikrelahi.api.common.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TranslationRequest(
        @NotBlank(message = "Translation text is required.")
        String text,

        @NotNull(message = "Translator ID is required.")
        Long translatorId,

        ContentStatus status) {

    /** Default to DRAFT when status is not supplied. */
    public ContentStatus effectiveStatus() {
        return status != null ? status : ContentStatus.DRAFT;
    }
}
