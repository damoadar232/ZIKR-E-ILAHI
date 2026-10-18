package com.zikrelahi.api.quran.juz;

/**
 * Public read-only projection of a Juz / Para record.
 * startRef and endRef are convenience strings (e.g. "2:142") for the frontend.
 */
public record JuzDto(
        int number,
        String arabicName,
        int startSurah,
        int startAyah,
        int endSurah,
        int endAyah,
        String startRef,
        String endRef) {

    public static JuzDto from(Juz juz) {
        return new JuzDto(
                juz.getNumber(),
                juz.getArabicName(),
                juz.getStartSurah(),
                juz.getStartAyah(),
                juz.getEndSurah(),
                juz.getEndAyah(),
                juz.getStartSurah() + ":" + juz.getStartAyah(),
                juz.getEndSurah()   + ":" + juz.getEndAyah());
    }
}
