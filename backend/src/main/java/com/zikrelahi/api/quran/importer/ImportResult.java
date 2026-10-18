package com.zikrelahi.api.quran.importer;

import java.util.List;

/**
 * Validation report returned by both /import/validate and /import/commit
 * (when validation fails).
 */
public record ImportResult(
        int totalRows,
        int validRows,
        int errorCount,
        List<ImportRowError> errors) {

    public boolean hasErrors() {
        return errorCount > 0;
    }
}
