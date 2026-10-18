package com.zikrelahi.api.quran.ayah;

import com.zikrelahi.api.common.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(
        @NotNull(message = "Status is required.")
        ContentStatus status) {}
