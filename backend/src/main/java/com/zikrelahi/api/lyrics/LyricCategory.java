package com.zikrelahi.api.lyrics;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "lyric_categories")
@Getter
@Setter
@NoArgsConstructor
public class LyricCategory {

    @Id
    @Column(length = 80, nullable = false)
    private String id;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120, unique = true)
    private String name;

    @JsonIgnore
    @ManyToMany(mappedBy = "categories")
    private Set<Lyric> lyrics = new LinkedHashSet<>();
}