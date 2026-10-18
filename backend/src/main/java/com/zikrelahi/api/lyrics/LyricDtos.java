package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.databind.JsonNode;
import com.zikrelahi.api.common.ContentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class LyricDtos {

    private LyricDtos() {
    }

    public record MetadataRequest(
            @Size(max = 120) String legacyId,
            @NotBlank @Size(max = 250) String title,
            @Size(max = 180) String slug,
            @Size(max = 120) String artistId,
            @Size(max = 120) String writerId,
            @Size(max = 200) String writerName,
            @Size(max = 120) String bookId,
            @Size(max = 2048) String coverImageUrl,
            Boolean featured,
            @Size(max = 20) List<@NotBlank @Size(max = 120) String> artistIds,
            @Size(max = 30) List<@NotBlank @Size(max = 200) String> reciters,
            @Size(max = 30) List<@NotBlank @Size(max = 80) String> categoryIds,
            @Size(max = 30) List<@NotBlank @Size(max = 80) String> subjectIds,
            @Size(max = 50) List<@NotBlank @Size(max = 120) String> tags,
            @Size(max = 40) List<@Valid MediaReferenceRequest> mediaReferences) {
    }

    public record MediaReferenceRequest(
            @NotNull LyricMediaType mediaType,
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 2048) String url) {
    }

    public record LanguageVersionRequest(
            @NotNull JsonNode document,
            @Size(max = 500) String changeNote,
            @jakarta.validation.constraints.PositiveOrZero Long expectedRowVersion) {
    }

    public record StatusRequest(@NotNull ContentStatus status) {
    }

    public record PublicLyricDto(
            String id,
            String title,
            String slug,
            String artistId,
            List<String> artistIds,
            List<String> reciters,
            String writerId,
            String writer,
            List<String> categoryIds,
            List<String> subjectIds,
            List<String> tags,
            String bookId,
            String image,
            boolean featured,
            LocalDateTime createdAt,
            List<PublicLanguageVersionDto> languageVersions,
            List<MediaReferenceDto> relatedAudio,
            List<MediaReferenceDto> relatedVideos) {
    }

    public record PublicLanguageVersionDto(
            LyricLanguageCode code,
            String label,
            String script,
            String dir,
            JsonNode document,
            String text) {
    }

    public record AdminLyricDto(
            Long id,
            String legacyId,
            String title,
            String slug,
            String artistId,
            List<String> artistIds,
            List<String> reciters,
            String writerId,
            String writer,
            List<String> categoryIds,
            List<String> subjectIds,
            List<String> tags,
            String bookId,
            String coverImageUrl,
            boolean featured,
            ContentStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<AdminLanguageVersionDto> languageVersions,
            List<MediaReferenceDto> mediaReferences) {
    }

    public record AdminLanguageVersionDto(
            Long id,
            LyricLanguageCode languageCode,
            JsonNode document,
            String plainText,
            ContentStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long rowVersion) {
    }

    public record RevisionDto(
            Long id,
            int revisionNumber,
            LyricLanguageCode languageCode,
            String lyricTitle,
            String lyricSlug,
            JsonNode document,
            String plainText,
            ContentStatus status,
            LocalDateTime versionUpdatedAt,
            LocalDateTime createdAt,
            String editorDisplayName,
            String changeNote) {
    }

    public record MediaReferenceDto(String mediaType, String title, String url) {
    }

    public record PageSlice<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    }
}