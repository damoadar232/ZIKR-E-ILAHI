package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.databind.JsonNode;
import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.common.ContentStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class LyricPersistenceService {

    private final LyricRepository lyricRepository;
    private final LyricLanguageVersionRepository languageVersionRepository;
    private final LyricRevisionRepository revisionRepository;

    @Transactional
    public LyricLanguageVersion saveLanguageVersion(
            Long lyricId,
            LyricLanguageCode languageCode,
            JsonNode document,
            String plainText,
            ContentStatus status,
            AdminUser editor,
            String changeNote) {
        if (languageCode == null)
            throw new IllegalArgumentException("A supported language code is required.");
        if (status == null)
            throw new IllegalArgumentException("A publication status is required.");
        TiptapDocumentRules.requirePersistable(document);

        Lyric lyric = lyricRepository.findById(lyricId)
                .orElseThrow(() -> new EntityNotFoundException("Lyric not found: " + lyricId));
        LyricLanguageVersion version = languageVersionRepository
                .findByLyric_IdAndLanguageCode(lyricId, languageCode)
                .orElseGet(() -> LyricLanguageVersion.builder()
                        .lyric(lyric)
                        .languageCode(languageCode)
                        .build());

        if (version.getId() != null) {
            int nextRevision = revisionRepository
                    .findTopByLanguageVersion_IdOrderByRevisionNumberDesc(version.getId())
                    .map(LyricRevision::getRevisionNumber)
                    .orElse(0) + 1;
            revisionRepository.save(LyricRevision.builder()
                    .lyric(lyric)
                    .languageVersion(version)
                    .revisionNumber(nextRevision)
                    .languageCode(version.getLanguageCode())
                    .lyricTitleSnapshot(lyric.getTitle())
                    .lyricSlugSnapshot(lyric.getSlug())
                    .documentSnapshot(TiptapDocumentValidator.validatePersisted(version.getDocument()).document())
                    .plainTextSnapshot(version.getPlainText())
                    .statusSnapshot(version.getStatus())
                    .versionUpdatedAt(version.getUpdatedAt())
                    .changedBy(editor)
                    .changeNote(StringUtils.hasText(changeNote) ? changeNote.trim() : null)
                    .build());
        }

        version.setDocument(document.deepCopy());
        version.setPlainText(StringUtils.hasText(plainText) ? plainText : null);
        version.setStatus(status);
        version.setUpdatedBy(editor);
        return languageVersionRepository.save(version);
    }
}