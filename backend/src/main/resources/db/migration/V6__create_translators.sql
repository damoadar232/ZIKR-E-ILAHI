-- V6: Translator / source attribution
-- Every translation row must reference a translator record so
-- licensing metadata is never orphaned.
-- language_code uses the same values as the LanguageCode enum: en, hi, ur
CREATE TABLE IF NOT EXISTS translators (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(200)    NOT NULL,
    language_code   VARCHAR(5)      NOT NULL,
    source_ref      VARCHAR(500)    NOT NULL,
    license         VARCHAR(200)    NOT NULL,
    license_notes   TEXT,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_translators          PRIMARY KEY (id),
    CONSTRAINT ck_translator_lang_code CHECK (language_code IN ('en', 'hi', 'ur'))
);
