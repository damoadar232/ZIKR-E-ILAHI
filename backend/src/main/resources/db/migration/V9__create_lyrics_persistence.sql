CREATE TABLE lyric_categories (
    id          VARCHAR(80)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    CONSTRAINT pk_lyric_categories PRIMARY KEY (id),
    CONSTRAINT uq_lyric_category_name UNIQUE (name)
);

INSERT INTO lyric_categories (id, name) VALUES
    ('naat-sharif', 'Naat Sharif'),
    ('hamd', 'Hamd'),
    ('durood-o-salam', 'Durood-o-Salam'),
    ('sufi-kalam', 'Sufi Kalam'),
    ('manqabat', 'Manqabat'),
    ('qawwali', 'Qawwali');

CREATE TABLE lyric_subjects (
    id          VARCHAR(80)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    CONSTRAINT pk_lyric_subjects PRIMARY KEY (id),
    CONSTRAINT uq_lyric_subject_name UNIQUE (name)
);

INSERT INTO lyric_subjects (id, name) VALUES
    ('madina', 'Madina'),
    ('prophet', 'Prophet ﷺ'),
    ('ramadan', 'Ramadan'),
    ('eid', 'Eid'),
    ('karbala', 'Karbala'),
    ('namaz', 'Namaz'),
    ('mercy', 'Mercy'),
    ('tawakkul', 'Tawakkul');

CREATE TABLE lyrics (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    legacy_id           VARCHAR(120)    NOT NULL,
    title               VARCHAR(250)    NOT NULL,
    slug                VARCHAR(180)    NOT NULL,
    artist_id           VARCHAR(120)    NULL,
    writer_id           VARCHAR(120)    NULL,
    writer_name         VARCHAR(200)    NULL,
    book_id             VARCHAR(120)    NULL,
    cover_image_url     VARCHAR(2048)   NULL,
    featured            BOOLEAN         NOT NULL DEFAULT FALSE,
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    created_by          BIGINT          NULL,
    updated_by          BIGINT          NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_lyrics PRIMARY KEY (id),
    CONSTRAINT uq_lyrics_legacy_id UNIQUE (legacy_id),
    CONSTRAINT uq_lyrics_slug UNIQUE (slug),
    CONSTRAINT fk_lyrics_created_by FOREIGN KEY (created_by)
        REFERENCES admin_users (id) ON DELETE SET NULL,
    CONSTRAINT fk_lyrics_updated_by FOREIGN KEY (updated_by)
        REFERENCES admin_users (id) ON DELETE SET NULL,
    CONSTRAINT ck_lyrics_status CHECK (status IN ('DRAFT', 'PUBLISHED'))
);

CREATE INDEX idx_lyrics_status_updated ON lyrics (status, updated_at);
CREATE INDEX idx_lyrics_artist ON lyrics (artist_id);
CREATE INDEX idx_lyrics_writer ON lyrics (writer_id);

CREATE TABLE lyric_category_assignments (
    lyric_id        BIGINT      NOT NULL,
    category_id     VARCHAR(80) NOT NULL,
    CONSTRAINT pk_lyric_category_assignments PRIMARY KEY (lyric_id, category_id),
    CONSTRAINT fk_lyric_category_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lyric_category_category FOREIGN KEY (category_id)
        REFERENCES lyric_categories (id) ON DELETE RESTRICT
);

CREATE INDEX idx_lyric_category_category ON lyric_category_assignments (category_id, lyric_id);

CREATE TABLE lyric_subject_assignments (
    lyric_id        BIGINT      NOT NULL,
    subject_id      VARCHAR(80) NOT NULL,
    CONSTRAINT pk_lyric_subject_assignments PRIMARY KEY (lyric_id, subject_id),
    CONSTRAINT fk_lyric_subject_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lyric_subject_subject FOREIGN KEY (subject_id)
        REFERENCES lyric_subjects (id) ON DELETE RESTRICT
);

CREATE INDEX idx_lyric_subject_subject ON lyric_subject_assignments (subject_id, lyric_id);

CREATE TABLE lyric_artist_ids (
    lyric_id        BIGINT       NOT NULL,
    artist_id       VARCHAR(120) NOT NULL,
    CONSTRAINT pk_lyric_artist_ids PRIMARY KEY (lyric_id, artist_id),
    CONSTRAINT fk_lyric_artist_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT
);

CREATE TABLE lyric_reciters (
    lyric_id        BIGINT       NOT NULL,
    position        INT          NOT NULL,
    display_name    VARCHAR(200) NOT NULL,
    CONSTRAINT pk_lyric_reciters PRIMARY KEY (lyric_id, position),
    CONSTRAINT fk_lyric_reciter_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT
);

CREATE TABLE lyric_tags (
    lyric_id        BIGINT       NOT NULL,
    tag             VARCHAR(120) NOT NULL,
    CONSTRAINT pk_lyric_tags PRIMARY KEY (lyric_id, tag),
    CONSTRAINT fk_lyric_tag_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT
);

CREATE TABLE lyric_media_references (
    lyric_id        BIGINT          NOT NULL,
    position        INT             NOT NULL,
    media_type      VARCHAR(10)     NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    url             VARCHAR(2048)   NOT NULL,
    CONSTRAINT pk_lyric_media_references PRIMARY KEY (lyric_id, position),
    CONSTRAINT fk_lyric_media_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT,
    CONSTRAINT ck_lyric_media_type CHECK (media_type IN ('AUDIO', 'VIDEO'))
);

CREATE TABLE lyric_language_versions (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    lyric_id            BIGINT          NOT NULL,
    language_code       VARCHAR(10)     NOT NULL,
    document            JSON            NOT NULL,
    plain_text          TEXT            NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    updated_by          BIGINT          NULL,
    row_version         BIGINT          NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_lyric_language_versions PRIMARY KEY (id),
    CONSTRAINT uq_lyric_language_version UNIQUE (lyric_id, language_code),
    CONSTRAINT fk_lyric_language_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lyric_language_updated_by FOREIGN KEY (updated_by)
        REFERENCES admin_users (id) ON DELETE SET NULL,
    CONSTRAINT ck_lyric_language_code CHECK (language_code IN ('ur', 'hi', 'roman')),
    CONSTRAINT ck_lyric_language_status CHECK (status IN ('DRAFT', 'PUBLISHED'))
);

CREATE INDEX idx_lyric_language_public ON lyric_language_versions
    (language_code, status, lyric_id);

CREATE TABLE lyric_revisions (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    lyric_id                BIGINT          NOT NULL,
    language_version_id     BIGINT          NOT NULL,
    revision_number         INT             NOT NULL,
    language_code           VARCHAR(10)     NOT NULL,
    lyric_title_snapshot    VARCHAR(250)    NOT NULL,
    lyric_slug_snapshot     VARCHAR(180)    NOT NULL,
    document_snapshot      JSON            NOT NULL,
    plain_text_snapshot    TEXT            NULL,
    status_snapshot         VARCHAR(20)     NOT NULL,
    version_updated_at      DATETIME        NOT NULL,
    changed_by              BIGINT          NULL,
    change_note             VARCHAR(500)    NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_lyric_revisions PRIMARY KEY (id),
    CONSTRAINT uq_lyric_revision_number UNIQUE (language_version_id, revision_number),
    CONSTRAINT fk_lyric_revision_lyric FOREIGN KEY (lyric_id)
        REFERENCES lyrics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lyric_revision_version FOREIGN KEY (language_version_id)
        REFERENCES lyric_language_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lyric_revision_changed_by FOREIGN KEY (changed_by)
        REFERENCES admin_users (id) ON DELETE SET NULL,
    CONSTRAINT ck_lyric_revision_language CHECK (language_code IN ('ur', 'hi', 'roman')),
    CONSTRAINT ck_lyric_revision_status CHECK (status_snapshot IN ('DRAFT', 'PUBLISHED'))
);

CREATE INDEX idx_lyric_revision_history ON lyric_revisions
    (lyric_id, language_code, revision_number DESC);