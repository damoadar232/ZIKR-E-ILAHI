package com.zikrelahi.api.quran.ayah;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class AyahId implements Serializable {

    private Short surahNumber;
    private Short ayahNumber;

    public static AyahId of(int surah, int ayah) {
        return new AyahId((short) surah, (short) ayah);
    }
}
