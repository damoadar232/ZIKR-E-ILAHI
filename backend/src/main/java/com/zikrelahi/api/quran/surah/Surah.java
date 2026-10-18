package com.zikrelahi.api.quran.surah;

import com.zikrelahi.api.common.ContentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "surahs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Surah {

    @Id
    @Column(nullable = false)
    private Short number;

    @Column(name = "arabic_name", nullable = false, length = 100)
    private String arabicName;

    @Column(name = "transliterated", nullable = false, length = 100)
    private String transliterated;

    @Column(name = "english_meaning", nullable = false, length = 200)
    private String englishMeaning;

    @Column(name = "ayah_count", nullable = false)
    private Short ayahCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RevelationType revelation;

    @Column(name = "revelation_order", nullable = false)
    private Short revelationOrder;

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
}
