package com.zikrelahi.api.quran.translator;

import com.zikrelahi.api.quran.translation.LanguageCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "translators")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Translator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "language_code", nullable = false, length = 5)
    private LanguageCode languageCode;

    @Column(name = "source_ref", nullable = false, length = 500)
    private String sourceRef;

    @Column(nullable = false, length = 200)
    private String license;

    @Column(name = "license_notes", columnDefinition = "TEXT")
    private String licenseNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    void onPersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
