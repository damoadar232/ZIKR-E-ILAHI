-- V1: Administrator accounts
-- Note: ON UPDATE CURRENT_TIMESTAMP is intentionally omitted because H2
-- (used in tests with MODE=MySQL) does not support it on DATETIME columns.
-- The @PreUpdate JPA callback in AdminUser.java handles updated_at instead.
CREATE TABLE IF NOT EXISTS admin_users (
    id                 BIGINT          NOT NULL AUTO_INCREMENT,
    email              VARCHAR(255)    NOT NULL,
    password_hash      VARCHAR(255)    NOT NULL,
    display_name       VARCHAR(100)    NOT NULL,
    role               VARCHAR(20)     NOT NULL DEFAULT 'ADMIN',
    enabled            BOOLEAN         NOT NULL DEFAULT TRUE,
    refresh_token_hash VARCHAR(255),
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_admin_users  PRIMARY KEY (id),
    CONSTRAINT uq_admin_email  UNIQUE (email),
    CONSTRAINT ck_admin_role   CHECK (role IN ('ADMIN', 'SUPER_ADMIN'))
);
