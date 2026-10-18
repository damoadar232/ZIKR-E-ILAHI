package com.zikrelahi.api.quran.surah;

import com.zikrelahi.api.common.ContentStatus;
import com.zikrelahi.api.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SurahService {

    private final SurahRepository surahRepository;

    @Transactional(readOnly = true)
    public List<SurahDto> listPublished(RevelationType revelation) {
        List<Surah> surahs = (revelation == null)
                ? surahRepository.findByStatusOrderByNumberAsc(ContentStatus.PUBLISHED)
                : surahRepository.findByRevelationAndStatusOrderByNumberAsc(
                        revelation, ContentStatus.PUBLISHED);
        return surahs.stream().map(SurahDto::from).toList();
    }

    @Transactional(readOnly = true)
    public SurahDto getPublished(int number) {
        if (number < 1 || number > 114) {
            throw new ResourceNotFoundException(
                    "Surah " + number + " does not exist. Valid range is 1–114.");
        }
        return surahRepository
                .findByNumberAndStatus((short) number, ContentStatus.PUBLISHED)
                .map(SurahDto::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Surah " + number + " is not yet published."));
    }
}
