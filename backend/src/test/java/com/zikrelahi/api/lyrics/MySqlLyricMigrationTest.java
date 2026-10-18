package com.zikrelahi.api.lyrics;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
class MySqlLyricMigrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void flywayAppliesLyricsMigrationAndSeedsOnlyTaxonomies() {
        assertEquals(9, jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '9' AND success = TRUE", Integer.class));
        assertEquals(6, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM lyric_categories", Integer.class));
        assertEquals(8, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM lyric_subjects", Integer.class));
        assertEquals(0, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM lyrics", Integer.class));
        assertEquals("json", jdbcTemplate.queryForObject(
                "SELECT data_type FROM information_schema.columns WHERE table_schema = DATABASE() " +
                        "AND table_name = 'lyric_language_versions' AND column_name = 'document'",
                String.class));
    }
}