package com.zikrelahi.api.quran.importer;

/**
 * Summary returned after a successful commit.
 * `imported` = new Ayahs created.
 * `updated`  = existing Ayahs whose Arabic text was replaced.
 * `translationsCreated` = new translation rows inserted.
 * `translationsUpdated`  = existing translation rows replaced.
 */
public record ImportSummary(
        int imported,
        int updated,
        int translationsCreated,
        int translationsUpdated) {}
