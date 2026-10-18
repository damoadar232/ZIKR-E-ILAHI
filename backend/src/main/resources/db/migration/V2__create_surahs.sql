-- V2: Surah metadata table
-- revelation_order: classical Nöldeke/Hijazi revelation sequence (1-114).
-- Compatible with H2 (MODE=MySQL) and MySQL 8.x.
CREATE TABLE IF NOT EXISTS surahs (
    number            SMALLINT        NOT NULL,
    arabic_name       VARCHAR(100)    NOT NULL,
    transliterated    VARCHAR(100)    NOT NULL,
    english_meaning   VARCHAR(200)    NOT NULL,
    ayah_count        SMALLINT        NOT NULL,
    revelation        VARCHAR(10)     NOT NULL DEFAULT 'Makki',
    revelation_order  SMALLINT        NOT NULL,
    status            VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_surahs            PRIMARY KEY (number),
    CONSTRAINT ck_surah_number      CHECK (number BETWEEN 1 AND 114),
    CONSTRAINT ck_ayah_count        CHECK (ayah_count > 0),
    CONSTRAINT ck_revelation        CHECK (revelation IN ('Makki', 'Madani')),
    CONSTRAINT ck_surah_status      CHECK (status IN ('DRAFT', 'PUBLISHED')),
    CONSTRAINT ck_rev_order         CHECK (revelation_order BETWEEN 1 AND 114),
    CONSTRAINT uq_revelation_order  UNIQUE (revelation_order)
);
