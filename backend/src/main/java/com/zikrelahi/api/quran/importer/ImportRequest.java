package com.zikrelahi.api.quran.importer;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ImportRequest(
        @NotNull(message = "rows array is required.")
        List<AyahImportRow> rows) {}
