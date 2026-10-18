package com.zikrelahi.api.quran.juz;

import com.zikrelahi.api.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JuzService {

    private final JuzRepository juzRepository;

    @Transactional(readOnly = true)
    public List<JuzDto> listAll() {
        return juzRepository.findAllByOrderByNumberAsc()
                .stream()
                .map(JuzDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public JuzDto getOne(int number) {
        if (number < 1 || number > 30) {
            throw new ResourceNotFoundException(
                    "Juz " + number + " does not exist. Valid range is 1–30.");
        }
        return juzRepository.findById((byte) number)
                .map(JuzDto::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Juz " + number + " was not found."));
    }
}
