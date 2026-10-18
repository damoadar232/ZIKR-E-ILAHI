package com.zikrelahi.api.lyrics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.zikrelahi.api.common.ContentStatus;

import java.util.List;
import java.util.Optional;

public interface LyricLanguageVersionRepository extends JpaRepository<LyricLanguageVersion, Long> {

    Optional<LyricLanguageVersion> findByLyric_IdAndLanguageCode(Long lyricId, LyricLanguageCode languageCode);

    List<LyricLanguageVersion> findAllByLyric_IdOrderByLanguageCode(Long lyricId);

    boolean existsByLyric_Id(Long lyricId);

    long countByLyric_IdAndStatus(Long lyricId, ContentStatus status);

    @Query("""
            select v from LyricLanguageVersion v
            where v.lyric.id in :lyricIds
            order by v.lyric.id, v.languageCode
            """)
    List<LyricLanguageVersion> findAllForLyricIds(@Param("lyricIds") List<Long> lyricIds);

    @Query("""
            select v from LyricLanguageVersion v
            where v.lyric.id in :lyricIds and v.status = :status
            order by v.lyric.id, v.languageCode
            """)
    List<LyricLanguageVersion> findAllForLyricIdsAndStatus(
            @Param("lyricIds") List<Long> lyricIds,
            @Param("status") ContentStatus status);
}