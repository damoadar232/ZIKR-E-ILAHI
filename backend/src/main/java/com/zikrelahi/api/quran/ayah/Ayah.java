package com.zikrelahi.api.quran.ayah;

import com.zikrelahi.api.common.ContentStatus;
import com.zikrelahi.api.quran.surah.Surah;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ayahs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ayah {

    @EmbeddedId
    private AyahId id;

    /** Convenience access — mirrors the PK surah_number column. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("surahNumber")
    @JoinColumn(name = "surah_number", nullable = false)
    private Surah surah;

    @Column(name = "arabic_text", nullable = false, columnDefinition = "TEXT")
    private String arabicText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    void onPersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Convenience getter — avoids dereferencing the embedded id repeatedly. */
    public short getSurahNumber() {
        return id.getSurahNumber();
    }

    public short getAyahNumber() {
        return id.getAyahNumber();
    }
}
