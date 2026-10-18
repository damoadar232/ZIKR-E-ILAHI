package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.zikrelahi.api.admin.AdminUser;
import com.zikrelahi.api.common.ContentStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "lyrics", uniqueConstraints = {
        @UniqueConstraint(name = "uq_lyrics_legacy_id", columnNames = "legacy_id"),
        @UniqueConstraint(name = "uq_lyrics_slug", columnNames = "slug")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lyric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    @Column(name = "legacy_id", nullable = false, length = 120, unique = true)
    private String legacyId;

    @NotBlank
    @Size(max = 250)
    @Column(nullable = false, length = 250)
    private String title;

    @NotBlank
    @Size(max = 180)
    @Column(nullable = false, length = 180, unique = true)
    private String slug;

    @Size(max = 120)
    @Column(name = "artist_id", length = 120)
    private String artistId;

    @Size(max = 120)
    @Column(name = "writer_id", length = 120)
    private String writerId;

    @Size(max = 200)
    @Column(name = "writer_name", length = 200)
    private String writerName;

    @Size(max = 120)
    @Column(name = "book_id", length = 120)
    private String bookId;

    @Size(max = 2048)
    @Column(name = "cover_image_url", length = 2048)
    private String coverImageUrl;

    @Builder.Default
    @Column(nullable = false)
    private boolean featured = false;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "lyric_category_assignments", joinColumns = @JoinColumn(name = "lyric_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    @Builder.Default
    private Set<LyricCategory> categories = new LinkedHashSet<>();

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "lyric_subject_assignments", joinColumns = @JoinColumn(name = "lyric_id"), inverseJoinColumns = @JoinColumn(name = "subject_id"))
    @Builder.Default
    private Set<LyricSubject> subjects = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "lyric_artist_ids", joinColumns = @JoinColumn(name = "lyric_id"))
    @Column(name = "artist_id", nullable = false, length = 120)
    @Builder.Default
    private Set<String> artistIds = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "lyric_reciters", joinColumns = @JoinColumn(name = "lyric_id"))
    @OrderColumn(name = "position")
    @Column(name = "display_name", nullable = false, length = 200)
    @Builder.Default
    private List<String> reciters = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "lyric_tags", joinColumns = @JoinColumn(name = "lyric_id"))
    @Column(name = "tag", nullable = false, length = 120)
    @Builder.Default
    private Set<String> tags = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "lyric_media_references", joinColumns = @JoinColumn(name = "lyric_id"))
    @OrderColumn(name = "position")
    @Builder.Default
    private List<LyricMediaReference> mediaReferences = new ArrayList<>();

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private AdminUser updatedBy;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @NotNull
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    void onPersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null)
            createdAt = now;
        if (updatedAt == null)
            updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}