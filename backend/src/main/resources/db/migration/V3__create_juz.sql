-- V3: Para / Juz mapping table
-- start_surah/start_ayah define the first Ayah of each Juz.
-- end_surah/end_ayah define the last Ayah (computed from the next Juz boundary minus one).
CREATE TABLE IF NOT EXISTS juz (
    number          TINYINT         NOT NULL,
    arabic_name     VARCHAR(100)    NOT NULL,
    start_surah     SMALLINT        NOT NULL,
    start_ayah      SMALLINT        NOT NULL,
    end_surah       SMALLINT        NOT NULL,
    end_ayah        SMALLINT        NOT NULL,
    CONSTRAINT pk_juz        PRIMARY KEY (number),
    CONSTRAINT ck_juz_number CHECK (number BETWEEN 1 AND 30),
    CONSTRAINT fk_juz_start  FOREIGN KEY (start_surah) REFERENCES surahs (number),
    CONSTRAINT fk_juz_end    FOREIGN KEY (end_surah)   REFERENCES surahs (number)
);
