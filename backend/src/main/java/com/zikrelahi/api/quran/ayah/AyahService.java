package com.zikrelahi.api.quran.ayah;

import com.zikrelahi.api.common.ConflictException;
import com.zikrelahi.api.common.ContentStatus;
import com.zikrelahi.api.common.ResourceNotFoundException;
import com.zikrelahi.api.quran.surah.Surah;
import com.zikrelahi.api.quran.surah.SurahRepository;
import com.zikrelahi.api.quran.translation.LanguageCode;
import com.zikrelahi.api.quran.translation.Translation;
import com.zikrelahi.api.quran.translation.TranslationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AyahService {

    private final AyahRepository ayahRepository;
    private final SurahRepository surahRepository;
    private final TranslationRepository translationRepository;

    // ─── Admin operations ─────────────────────────────────────────────────────

    @Transactional
    public AyahDto create(AyahRequest req) {
        // 1. Validate Surah bounds
        Surah surah = surahRepository.findById((short) (int) req.surahNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Surah " + req.surahNumber() + " does not exist."));

        // 2. Validate Ayah bounds against authoritative Surah ayah_count
        if (req.ayahNumber() < 1 || req.ayahNumber() > surah.getAyahCount()) {
            throw new IllegalArgumentException(
                    "Ayah " + req.ayahNumber() + " is out of range for Surah "
                    + req.surahNumber() + " (max " + surah.getAyahCount() + ").");
        }

        // 3. Reject duplicates
        if (ayahRepository.existsByIdSurahNumberAndIdAyahNumber(
                (short) (int) req.surahNumber(), (short) (int) req.ayahNumber())) {
            throw new ConflictException(
                    "Ayah " + req.surahNumber() + ":" + req.ayahNumber()
                    + " already exists. Use PUT to update it.");
        }

        // 4. Persist
        Ayah ayah = Ayah.builder()
                .id(AyahId.of(req.surahNumber(), req.ayahNumber()))
                .surah(surah)
                .arabicText(req.arabicText())
                .status(ContentStatus.DRAFT)
                .build();
        return AyahDto.from(ayahRepository.save(ayah));
    }

    @Transactional(readOnly = true)
    public AyahDto getOne(int surahNumber, int ayahNumber) {
        return findOrThrow(surahNumber, ayahNumber);
    }

    @Transactional(readOnly = true)
    public List<AyahDto> listBySurah(int surahNumber) {
        return ayahRepository
                .findByIdSurahNumberAndStatusOrderByIdAyahNumberAsc(
                        (short) surahNumber, ContentStatus.PUBLISHED)
                .stream()
                .map(AyahDto::from)
                .toList();
    }

    @Transactional
    public AyahDto updateStatus(int surahNumber, int ayahNumber, ContentStatus status) {
        Ayah ayah = resolveAyah(surahNumber, ayahNumber);
        ayah.setStatus(status);
        return AyahDto.from(ayahRepository.save(ayah));
    }

    @Transactional
    public AyahDto updateArabicText(int surahNumber, int ayahNumber, String arabicText) {
        Ayah ayah = resolveAyah(surahNumber, ayahNumber);
        ayah.setArabicText(arabicText);
        return AyahDto.from(ayahRepository.save(ayah));
    }

    @Transactional
    public void delete(int surahNumber, int ayahNumber) {
        Ayah ayah = resolveAyah(surahNumber, ayahNumber);
        ayahRepository.delete(ayah);
    }

    // ─── Public reader operation ──────────────────────────────────────────────

    /**
     * Returns all published Ayahs for a Surah with the requested translation.
     * Only Ayahs that have a published translation in the requested language are returned.
     * Ayahs with no published translation in that language are silently omitted —
     * the frontend reader shows "unavailable" notices for slots with no content.
     */
    @Transactional(readOnly = true)
    public List<PublicAyahDto> listPublishedWithTranslation(int surahNumber, String langCode) {
        if (surahNumber < 1 || surahNumber > 114) {
            throw new ResourceNotFoundException(
                    "Surah " + surahNumber + " does not exist.");
        }
        LanguageCode language;
        try {
            language = LanguageCode.valueOf(langCode);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Translation language '" + langCode + "' is not supported. Use en, hi, or ur.");
        }
        // Each row is Object[]{Translation, arabicText String}
        return translationRepository
                .findPublishedWithArabicBySurahAndLanguage(
                        (short) surahNumber, language, ContentStatus.PUBLISHED)
                .stream()
                .map(row -> PublicAyahDto.from((Translation) row[0], (String) row[1]))
                .toList();
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    private AyahDto findOrThrow(int surahNumber, int ayahNumber) {
        return ayahRepository
                .findByIdSurahNumberAndIdAyahNumber(
                        (short) surahNumber, (short) ayahNumber)
                .map(AyahDto::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ayah " + surahNumber + ":" + ayahNumber + " not found."));
    }

    private Ayah resolveAyah(int surahNumber, int ayahNumber) {
        return ayahRepository
                .findByIdSurahNumberAndIdAyahNumber(
                        (short) surahNumber, (short) ayahNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ayah " + surahNumber + ":" + ayahNumber + " not found."));
    }
}
