package com.zikrelahi.api.quran.juz;

import com.zikrelahi.api.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quran/juz")
@RequiredArgsConstructor
public class JuzController {

    private final JuzService juzService;

    /**
     * GET /api/v1/quran/juz
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<JuzDto>>> listJuz() {
        return ResponseEntity.ok(ApiResponse.ok(juzService.listAll()));
    }

    /**
     * GET /api/v1/quran/juz/{number}
     */
    @GetMapping("/{number}")
    public ResponseEntity<ApiResponse<JuzDto>> getJuz(
            @PathVariable int number) {
        return ResponseEntity.ok(ApiResponse.ok(juzService.getOne(number)));
    }
}
