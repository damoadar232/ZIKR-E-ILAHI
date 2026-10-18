-- V7: Ayah Arabic text
-- Composite PK (surah_number, ayah_number) — no surrogate key needed
-- because the Quran's canonical addressing is globally unique.
-- arabic_text stored as TEXT to accommodate long Ayahs with full Unicode.
-- ON UPDATE CURRENT_TIMESTAMP omitted for H2 compatibility;
-- @PreUpdate JPA callback in Ayah.java manages updated_at.
CREATE TABLE IF NOT EXISTS ayahs (
    surah_number    SMALLINT        NOT NULL,
    ayah_number     SMALLINT        NOT NULL,
    arabic_text     TEXT            NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ayahs         PRIMARY KEY (surah_number, ayah_number),
    CONSTRAINT fk_ayah_surah    FOREIGN KEY (surah_number)
                                    REFERENCES surahs (number),
    CONSTRAINT ck_ayah_number   CHECK (ayah_number >= 1),
    CONSTRAINT ck_ayah_status   CHECK (status IN ('DRAFT', 'PUBLISHED'))
);
