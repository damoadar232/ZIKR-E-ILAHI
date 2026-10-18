package com.zikrelahi.api.quran.translation;

import com.zikrelahi.api.common.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TranslationRepository extends JpaRepository<Translation, Long> {

    Optional<Translation> findBySurahNumberAndAyahNumberAndLanguageCode(
            Short surahNumber, Short ayahNumber, LanguageCode languageCode);

    /**
     * Returns all published Translations for a given Surah in one language,
     * joined to the Ayah to fetch arabicText.
     * The Ayah join is explicit because Translation no longer holds a JPA
     * association to Ayah (avoids @EmbeddedId join column resolution issues).
     */
    @Query("""
            SELECT t FROM Translation t
             JOIN FETCH t.translator tr
             JOIN com.zikrelahi.api.quran.ayah.Ayah a
               ON a.id.surahNumber = t.surahNumber
              AND a.id.ayahNumber  = t.ayahNumber
             WHERE t.surahNumber  = :surah
               AND t.languageCode = :lang
               AND t.status       = :status
               AND a.status       = :status
             ORDER BY t.ayahNumber ASC
            """)
    List<Translation> findPublishedBySurahAndLanguage(
            @Param("surah")  Short surah,
            @Param("lang")   LanguageCode lang,
            @Param("status") ContentStatus status);

    /**
     * Fetches Ayah arabic text alongside each Translation row.
     * Returns Object[] rows: [Translation, arabicText String].
     */
    @Query("""
            SELECT t, a.arabicText FROM Translation t
             JOIN t.translator tr
             JOIN com.zikrelahi.api.quran.ayah.Ayah a
               ON a.id.surahNumber = t.surahNumber
              AND a.id.ayahNumber  = t.ayahNumber
             WHERE t.surahNumber  = :surah
               AND t.languageCode = :lang
               AND t.status       = :status
               AND a.status       = :status
             ORDER BY t.ayahNumber ASC
            """)
    List<Object[]> findPublishedWithArabicBySurahAndLanguage(
            @Param("surah")  Short surah,
            @Param("lang")   LanguageCode lang,
            @Param("status") ContentStatus status);
}
