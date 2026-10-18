package com.zikrelahi.api.quran.translation;

import com.zikrelahi.api.common.ContentStatus;
import com.zikrelahi.api.quran.translator.Translator;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One row per (surah_number, ayah_number, language_code).
 *
 * The FK to ayahs is intentionally stored as plain columns (surahNumber,
 * ayahNumber) rather than a @ManyToOne association. Hibernate 6 has known
 * issues resolving referencedColumnName for @EmbeddedId PKs across
 * bidirectional mappings. Using plain columns is simpler, avoids the
 * mapping ambiguity, and the JPQL query in TranslationRepository handles
 * the join explicitly.
 */
@Entity
@Table(name = "translations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Translation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "surah_number", nullable = false)
    private Short surahNumber;

    @Column(name = "ayah_number", nullable = false)
    private Short ayahNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "language_code", nullable = false, length = 5)
    private LanguageCode languageCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "translator_id", nullable = false)
    private Translator translator;

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
