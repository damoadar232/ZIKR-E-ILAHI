-- V8: Translations — one row per Ayah per language.
-- The UNIQUE constraint on (surah_number, ayah_number, language_code)
-- enforces independence: updating Hindi never touches English or Urdu rows.
-- translator_id FK ensures attribution is always recorded.
-- Covering index speeds up the most common public query:
--   "all published Ayahs for Surah N in language X, ordered by ayah_number"
CREATE TABLE IF NOT EXISTS translations (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    surah_number    SMALLINT        NOT NULL,
    ayah_number     SMALLINT        NOT NULL,
    language_code   VARCHAR(5)      NOT NULL,
    text            TEXT            NOT NULL,
    translator_id   BIGINT          NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_translations              PRIMARY KEY (id),
    CONSTRAINT uq_translation_per_language  UNIQUE (surah_number, ayah_number, language_code),
    CONSTRAINT fk_translation_ayah          FOREIGN KEY (surah_number, ayah_number)
                                                REFERENCES ayahs (surah_number, ayah_number),
    CONSTRAINT fk_translation_translator    FOREIGN KEY (translator_id)
                                                REFERENCES translators (id),
    CONSTRAINT ck_translation_lang_code     CHECK (language_code IN ('en', 'hi', 'ur')),
    CONSTRAINT ck_translation_status        CHECK (status IN ('DRAFT', 'PUBLISHED'))
);

CREATE INDEX idx_translations_surah_lang_status
    ON translations (surah_number, language_code, status, ayah_number);
