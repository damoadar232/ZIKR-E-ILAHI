package com.zikrelahi.api.quran.juz;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "juz")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Juz {

    @Id
    @Column(nullable = false)
    private Byte number;

    @Column(name = "arabic_name", nullable = false, length = 100)
    private String arabicName;

    @Column(name = "start_surah", nullable = false)
    private Short startSurah;

    @Column(name = "start_ayah", nullable = false)
    private Short startAyah;

    @Column(name = "end_surah", nullable = false)
    private Short endSurah;

    @Column(name = "end_ayah", nullable = false)
    private Short endAyah;
}
