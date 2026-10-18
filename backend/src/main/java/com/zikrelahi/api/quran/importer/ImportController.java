package com.zikrelahi.api.quran.importer;

import com.zikrelahi.api.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Bulk import endpoints — both require ADMIN role (via SecurityConfig).
 *
 * POST /api/v1/admin/quran/import/validate
 *   Validates the batch without writing to the database.
 *   Returns 200 with ImportResult when clean, 422 when errors found.
 *
 * POST /api/v1/admin/quran/import/commit
 *   Validates then commits the batch in a single transaction.
 *   Returns 200 with ImportSummary when successful.
 *   Returns 422 with ImportResult when validation fails (no writes).
 */
@RestController
@RequestMapping("/api/v1/admin/quran/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ImportResult>> validate(
            @Valid @RequestBody ImportRequest request) {

        ImportResult result = importService.validate(request.rows());

        if (result.hasErrors()) {
            return ResponseEntity
                    .status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(new ApiResponse<>(result, "VALIDATION_FAILED",
                            result.errorCount() + " validation error(s) found."));
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/commit")
    public ResponseEntity<ApiResponse<ImportSummary>> commit(
            @Valid @RequestBody ImportRequest request) {

        ImportSummary summary = importService.commit(request.rows());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
