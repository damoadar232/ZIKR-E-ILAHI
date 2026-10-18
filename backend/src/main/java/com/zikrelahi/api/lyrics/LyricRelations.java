package com.zikrelahi.api.lyrics;

import com.zikrelahi.api.lyrics.LyricDtos.MediaReferenceDto;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

final class LyricRelations {
    final Set<String> categoryIds = new LinkedHashSet<>();
    final Set<String> subjectIds = new LinkedHashSet<>();
    final Set<String> artistIds = new LinkedHashSet<>();
    final List<String> reciters = new ArrayList<>();
    final Set<String> tags = new LinkedHashSet<>();
    final List<MediaReferenceDto> mediaReferences = new ArrayList<>();

    List<String> categoryIds() {
        return List.copyOf(categoryIds);
    }

    List<String> subjectIds() {
        return List.copyOf(subjectIds);
    }

    List<String> artistIds() {
        return List.copyOf(artistIds);
    }

    List<String> reciters() {
        return List.copyOf(reciters);
    }

    List<String> tags() {
        return List.copyOf(tags);
    }

    List<MediaReferenceDto> mediaReferences() {
        return List.copyOf(mediaReferences);
    }
}