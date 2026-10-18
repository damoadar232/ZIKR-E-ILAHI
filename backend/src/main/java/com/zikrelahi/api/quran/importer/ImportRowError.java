package com.zikrelahi.api.quran.importer;

/**
 * One validation error for one row in the import batch.
 * The `row` field is the 1-based index into the rows array.
 */
public record ImportRowError(
        int row,
        Integer surahNumber,
        Integer ayahNumber,
        String field,
        String code,
        String message) {}
