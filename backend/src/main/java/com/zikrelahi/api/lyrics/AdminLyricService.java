package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.databind.JsonNode;
import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.common.ConflictException;
import com.zikrelahi.api.common.ContentStatus;
import com.zikrelahi.api.common.ResourceNotFoundException;
import com.zikrelahi.api.lyrics.LyricDtos.AdminLyricDto;
import com.zikrelahi.api.lyrics.LyricDtos.LanguageVersionRequest;
import com.zikrelahi.api.lyrics.LyricDtos.MediaReferenceRequest;
import com.zikrelahi.api.lyrics.LyricDtos.MetadataRequest;
import com.zikrelahi.api.lyrics.LyricDtos.PageSlice;
import com.zikrelahi.api.lyrics.LyricDtos.RevisionDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import static com.zikrelahi.api.lyrics.LyricDtos.*;

@Service
public class AdminLyricService {

    private final LyricRepository lyricRepository;
    private final LyricCategoryRepository categoryRepository;
    private final LyricSubjectRepository subjectRepository;
    private final LyricLanguageVersionRepository languageVersionRepository;
    private final LyricRevisionRepository revisionRepository;
    private final LyricPersistenceService persistenceService;
    private final LyricDtoAssembler assembler;

    public AdminLyricService(LyricRepository lyricRepository,
            LyricCategoryRepository categoryRepository,
            LyricSubjectRepository subjectRepository,
            LyricLanguageVersionRepository languageVersionRepository,
            LyricRevisionRepository revisionRepository,
            LyricPersistenceService persistenceService,
            LyricDtoAssembler assembler) {
        this.lyricRepository = lyricRepository;
        this.categoryRepository = categoryRepository;
        this.subjectRepository = subjectRepository;
        this.languageVersionRepository = languageVersionRepository;
        this.revisionRepository = revisionRepository;
        this.persistenceService = persistenceService;
        this.assembler = assembler;
    }

    @Transactional
    public AdminLyricDto create(MetadataRequest request, AdminUser editor) {
        String slug = StringUtils.hasText(request.slug()) ? normalizeSlug(request.slug()) : slugify(request.title());
        String legacyId = StringUtils.hasText(request.legacyId()) ? request.legacyId().trim() : slug;
        if (!StringUtils.hasText(slug) || !StringUtils.hasText(legacyId)) {
            throw new IllegalArgumentException("Provide a URL slug or a title that can be converted to one.");
        }
        Lyric lyric = Lyric.builder()
                .legacyId(legacyId)
                .title(request.title().trim())
                .slug(slug)
                .status(ContentStatus.DRAFT)
                .createdBy(editor)
                .updatedBy(editor)
                .build();
        applyMetadata(lyric, request);
        return assembler.toAdmin(lyricRepository.saveAndFlush(lyric));
    }

    @Transactional(readOnly = true)
    public PageSlice<AdminLyricDto> list(int page, int size, String status, String query) {
        PublicLyricService.requirePageBounds(page, size);
        ContentStatus parsedStatus = parseStatus(status);
        Page<Lyric> results = lyricRepository.findAdminPage(parsedStatus,
                StringUtils.hasText(query) ? query.trim().toLowerCase(Locale.ROOT) : null,
                PageRequest.of(page, size));
        return new PageSlice<>(assembler.toAdmin(results.getContent()), results.getNumber(),
                results.getSize(), results.getTotalElements(), results.getTotalPages());
    }

    @Transactional(readOnly = true)
    public AdminLyricDto get(String reference) {
        return assembler.toAdmin(findAdmin(reference));
    }

    @Transactional
    public AdminLyricDto updateMetadata(String reference, MetadataRequest request, AdminUser editor) {
        Lyric lyric = findAdmin(reference);
        lyric.setTitle(request.title().trim());
        if (StringUtils.hasText(request.slug()))
            lyric.setSlug(normalizeSlug(request.slug()));
        lyric.setUpdatedBy(editor);
        applyMetadata(lyric, request);
        return assembler.toAdmin(lyricRepository.saveAndFlush(lyric));
    }

    @Transactional
    public AdminLyricDto saveLanguage(String reference, String languageCode,
            LanguageVersionRequest request, AdminUser editor) {
        Lyric lyric = findAdmin(reference);
        LyricLanguageCode language = LyricLanguageCode.fromApiCode(languageCode);
        TiptapDocumentValidator.ValidatedDocument validated = TiptapDocumentValidator.validate(request.document());
        LyricLanguageVersion currentVersion = languageVersionRepository
                .findByLyric_IdAndLanguageCode(lyric.getId(), language).orElse(null);
        if (currentVersion == null && request.expectedRowVersion() != null) {
            throw new ConflictException("This language version changed after it was loaded. Reload before saving.");
        }
        if (currentVersion != null && (request.expectedRowVersion() == null
                || !request.expectedRowVersion().equals(currentVersion.getRowVersion()))) {
            throw new ConflictException("This language version changed after it was loaded. Reload before saving.");
        }
        boolean demoteLyric = isOnlyPublishedLanguage(lyric, language);
        persistenceService.saveLanguageVersion(lyric.getId(), language, validated.document(),
                validated.plainText(), ContentStatus.DRAFT, editor, request.changeNote());
        if (demoteLyric) {
            lyric.setStatus(ContentStatus.DRAFT);
            lyric.setUpdatedBy(editor);
            lyricRepository.save(lyric);
        }
        return assembler.toAdmin(lyricRepository.findById(lyric.getId()).orElseThrow());
    }

    @Transactional
    public AdminLyricDto setLanguageStatus(String reference, String languageCode,
            ContentStatus status, AdminUser editor) {
        Lyric lyric = findAdmin(reference);
        LyricLanguageCode language = LyricLanguageCode.fromApiCode(languageCode);
        LyricLanguageVersion version = languageVersionRepository
                .findByLyric_IdAndLanguageCode(lyric.getId(), language)
                .orElseThrow(() -> new ResourceNotFoundException("Language version not found."));
        TiptapDocumentValidator.ValidatedDocument validated = TiptapDocumentValidator
                .validatePersisted(version.getDocument());
        boolean demoteLyric = status == ContentStatus.DRAFT && isOnlyPublishedLanguage(lyric, language);
        persistenceService.saveLanguageVersion(lyric.getId(), language, validated.document(),
                validated.plainText(), status, editor, "Language status changed to " + status.name() + ".");
        if (demoteLyric) {
            lyric.setStatus(ContentStatus.DRAFT);
            lyric.setUpdatedBy(editor);
            lyricRepository.save(lyric);
        }
        return assembler.toAdmin(lyricRepository.findById(lyric.getId()).orElseThrow());
    }

    @Transactional
    public AdminLyricDto setLyricStatus(String reference, ContentStatus status, AdminUser editor) {
        Lyric lyric = findAdmin(reference);
        if (status == ContentStatus.PUBLISHED
                && languageVersionRepository.countByLyric_IdAndStatus(lyric.getId(), ContentStatus.PUBLISHED) == 0) {
            throw new ConflictException("Publish at least one language version before publishing a lyric.");
        }
        lyric.setStatus(status);
        lyric.setUpdatedBy(editor);
        return assembler.toAdmin(lyricRepository.saveAndFlush(lyric));
    }

    @Transactional(readOnly = true)
    public List<RevisionDto> revisions(String reference, String languageCode) {
        Lyric lyric = findAdmin(reference);
        LyricLanguageCode language = LyricLanguageCode.fromApiCode(languageCode);
        LyricLanguageVersion version = languageVersionRepository
                .findByLyric_IdAndLanguageCode(lyric.getId(), language)
                .orElseThrow(() -> new ResourceNotFoundException("Language version not found."));
        return revisionRepository.findAllByLanguageVersion_IdOrderByRevisionNumberDesc(version.getId())
                .stream().map(assembler::toRevision).toList();
    }

    @Transactional
    public void delete(String reference) {
        Lyric lyric = findAdmin(reference);
        if (languageVersionRepository.existsByLyric_Id(lyric.getId())) {
            throw new ConflictException(
                    "Lyrics with language versions or revision history cannot be deleted. Unpublish the lyric instead.");
        }
        lyricRepository.delete(lyric);
    }

    private Lyric findAdmin(String reference) {
        if (!StringUtils.hasText(reference))
            throw new ResourceNotFoundException("Lyric not found.");
        return lyricRepository.findByLegacyId(reference)
                .or(() -> lyricRepository.findBySlug(reference))
                .or(() -> findByNumericId(reference))
                .orElseThrow(() -> new ResourceNotFoundException("Lyric not found."));
    }

    private java.util.Optional<Lyric> findByNumericId(String reference) {
        try {
            return lyricRepository.findById(Long.parseLong(reference));
        } catch (NumberFormatException ignored) {
            return java.util.Optional.empty();
        }
    }

    private void applyMetadata(Lyric lyric, MetadataRequest request) {
        lyric.setArtistId(clean(request.artistId()));
        lyric.setArtistIds(new LinkedHashSet<>(cleanStrings(request.artistIds())));
        lyric.setReciters(cleanStrings(request.reciters()));
        lyric.setWriterId(clean(request.writerId()));
        lyric.setWriterName(clean(request.writerName()));
        lyric.setBookId(clean(request.bookId()));
        lyric.setCoverImageUrl(clean(request.coverImageUrl()));
        lyric.setFeatured(Boolean.TRUE.equals(request.featured()));
        lyric.setTags(new LinkedHashSet<>(cleanStrings(request.tags())));
        lyric.setCategories(resolveCategories(request.categoryIds()));
        lyric.setSubjects(resolveSubjects(request.subjectIds()));
        lyric.setMediaReferences(resolveMedia(request.mediaReferences()));
    }

    private Set<LyricCategory> resolveCategories(List<String> ids) {
        if (ids == null || ids.isEmpty())
            return new LinkedHashSet<>();
        List<LyricCategory> categories = categoryRepository.findAllById(ids);
        if (categories.size() != new LinkedHashSet<>(ids).size()) {
            throw new IllegalArgumentException("One or more category IDs are unknown.");
        }
        return new LinkedHashSet<>(categories);
    }

    private boolean isOnlyPublishedLanguage(Lyric lyric, LyricLanguageCode language) {
        return lyric.getStatus() == ContentStatus.PUBLISHED
                && languageVersionRepository.countByLyric_IdAndStatus(lyric.getId(), ContentStatus.PUBLISHED) == 1
                && languageVersionRepository.findByLyric_IdAndLanguageCode(lyric.getId(), language)
                        .map(version -> version.getStatus() == ContentStatus.PUBLISHED)
                        .orElse(false);
    }

    private Set<LyricSubject> resolveSubjects(List<String> ids) {
        if (ids == null || ids.isEmpty())
            return new LinkedHashSet<>();
        List<LyricSubject> subjects = subjectRepository.findAllById(ids);
        if (subjects.size() != new LinkedHashSet<>(ids).size()) {
            throw new IllegalArgumentException("One or more subject IDs are unknown.");
        }
        return new LinkedHashSet<>(subjects);
    }

    private List<LyricMediaReference> resolveMedia(List<MediaReferenceRequest> references) {
        if (references == null)
            return new ArrayList<>();
        return references.stream().map(reference -> {
            if (!"https".equalsIgnoreCase(URI.create(reference.url()).getScheme())) {
                throw new IllegalArgumentException("Related media URLs must use HTTPS.");
            }
            return LyricMediaReference.builder().mediaType(reference.mediaType())
                    .title(reference.title().trim()).url(reference.url().trim()).build();
        }).toList();
    }

    private static ContentStatus parseStatus(String status) {
        if (!StringUtils.hasText(status))
            return null;
        try {
            return ContentStatus.valueOf(status);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("status must be DRAFT or PUBLISHED.");
        }
    }

    private static List<String> cleanStrings(List<String> values) {
        if (values == null)
            return new ArrayList<>();
        return values.stream().map(String::trim).filter(StringUtils::hasText).distinct().toList();
    }

    private static String clean(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String slugify(String value) {
        return normalizeSlug(Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", ""));
    }

    private static String normalizeSlug(String value) {
        String slug = value.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9-]+", "-").replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        if (slug.isEmpty())
            throw new IllegalArgumentException("slug must contain at least one letter or digit.");
        return slug;
    }
}