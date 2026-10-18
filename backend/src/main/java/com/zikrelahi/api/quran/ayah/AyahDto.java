package com.zikrelahi.api.quran.ayah;

import com.zikrelahi.api.common.ContentStatus;

/**
 * Admin-facing Ayah DTO — includes status so editors can see draft state.
 */
public record AyahDto(
        int surahNumber,
        int ayahNumber,
        String arabicText,
        String status) {

    public static AyahDto from(Ayah ayah) {
        return new AyahDto(
                ayah.getSurahNumber(),
                ayah.getAyahNumber(),
                ayah.getArabicText(),
                ayah.getStatus().name());
    }
}
