package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zikrelahi.api.common.ContentStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LyricPersistenceTest {

    @Autowired
    private LyricRepository lyricRepository;
    @Autowired
    private LyricCategoryRepository categoryRepository;
    @Autowired
    private LyricLanguageVersionRepository versionRepository;
    @Autowired
    private LyricRevisionRepository revisionRepository;
    @Autowired
    private LyricPersistenceService persistenceService;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private EntityManager entityManager;

    @Test
    void persistsLegacyMetadataCategoryLanguageAndJsonDocument() throws Exception {
        Lyric lyric = lyricRepository.saveAndFlush(Lyric.builder()
                .legacyId("786-durood")
                .title("786 Durood")
                .slug("786-durood")
                .artistId("traditional")
                .writerId("traditional-poet")
                .writerName("Traditional")
                .reciters(java.util.List.of("Traditional"))
                .artistIds(Set.of("traditional"))
                .categories(Set.of(categoryRepository.findById("durood-o-salam").orElseThrow()))
                .status(ContentStatus.PUBLISHED)
                .build());
        JsonNode document = document("Blessings and peace");

        LyricLanguageVersion saved = persistenceService.saveLanguageVersion(
                lyric.getId(), LyricLanguageCode.roman, document, "Blessings and peace",
                ContentStatus.PUBLISHED, null, null);
        entityManager.flush();
        entityManager.clear();

        LyricLanguageVersion loaded = versionRepository.findById(saved.getId()).orElseThrow();
        Lyric loadedLyric = lyricRepository.findByLegacyId("786-durood").orElseThrow();
        JsonNode storedDocument = loaded.getDocument();
        if (storedDocument.isTextual()) {
            storedDocument = objectMapper.readTree(storedDocument.asText());
        }
        assertEquals(document, storedDocument);
        assertEquals(LyricLanguageCode.roman, loaded.getLanguageCode());
        assertEquals("en", loaded.getLanguageCode().toEditorCode());
        assertEquals("traditional-poet", loadedLyric.getWriterId());
        assertEquals(Set.of("durood-o-salam"), loadedLyric.getCategories().stream().map(LyricCategory::getId)
                .collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void databaseRejectsDuplicateLanguageVersion() throws Exception {
        Lyric lyric = saveLyric("duplicate-test");
        LyricLanguageVersion first = version(lyric, LyricLanguageCode.ur, document("First"));
        versionRepository.saveAndFlush(first);

        LyricLanguageVersion duplicate = version(lyric, LyricLanguageCode.ur, document("Second"));
        assertThrows(DataIntegrityViolationException.class, () -> versionRepository.saveAndFlush(duplicate));
    }

    @Test
    void databaseRejectsLanguageVersionForMissingLyric() throws Exception {
        LyricLanguageVersion orphan = version(entityManager.getReference(Lyric.class, Long.MAX_VALUE),
                LyricLanguageCode.hi, document("Orphan"));

        assertThrows(DataIntegrityViolationException.class, () -> versionRepository.saveAndFlush(orphan));
    }

    @Test
    void directJpaWritesRejectEmptyDocuments() throws Exception {
        Lyric lyric = saveLyric("empty-document-test");
        JsonNode emptyDocument = objectMapper
                .readTree("{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[]}]}");

        assertThrows(RuntimeException.class, () -> versionRepository.saveAndFlush(
                version(lyric, LyricLanguageCode.ur, emptyDocument)));
    }

    @Test
    void updatesStorePriorLanguageSnapshotAndRejectEmptyDocuments() throws Exception {
        Lyric lyric = saveLyric("revision-test");
        persistenceService.saveLanguageVersion(lyric.getId(), LyricLanguageCode.hi,
                document("Prior text"), "Prior text", ContentStatus.DRAFT, null, "first save");
        LyricLanguageVersion current = persistenceService.saveLanguageVersion(lyric.getId(), LyricLanguageCode.hi,
                document("Current text"), "Current text", ContentStatus.DRAFT, null, "corrected line");

        var revisions = revisionRepository.findAllByLanguageVersion_IdOrderByRevisionNumberDesc(current.getId());
        assertEquals(1, revisions.size());
        assertEquals("Prior text", revisions.getFirst().getDocumentSnapshot().at("/content/0/content/0/text").asText());
        assertEquals("786 Durood", revisions.getFirst().getLyricTitleSnapshot());
        assertThrows(IllegalArgumentException.class, () -> persistenceService.saveLanguageVersion(
                lyric.getId(), LyricLanguageCode.ur, objectMapper.createObjectNode()
                        .put("type", "doc").set("content", objectMapper.createArrayNode()),
                "", ContentStatus.DRAFT, null, null));
        assertTrue(lyricRepository.existsById(lyric.getId()));
    }

    private Lyric saveLyric(String suffix) {
        return lyricRepository.saveAndFlush(Lyric.builder()
                .legacyId(suffix)
                .title("786 Durood")
                .slug(suffix)
                .build());
    }

    private LyricLanguageVersion version(Lyric lyric, LyricLanguageCode code, JsonNode document) {
        return LyricLanguageVersion.builder()
                .lyric(lyric)
                .languageCode(code)
                .document(document)
                .status(ContentStatus.DRAFT)
                .build();
    }

    private JsonNode document(String text) throws Exception {
        return objectMapper.readTree(
                "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\""
                        + text + "\"}]}]}");
    }
}