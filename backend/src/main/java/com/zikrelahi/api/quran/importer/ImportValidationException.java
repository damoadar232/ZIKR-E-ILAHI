package com.zikrelahi.api.quran.importer;

/**
 * Thrown when bulk import validation fails.
 * Caught by GlobalExceptionHandler to return HTTP 422 with the error report.
 */
public class ImportValidationException extends RuntimeException {

    private final ImportResult result;

    public ImportValidationException(ImportResult result) {
        super("Import validation failed with " + result.errorCount() + " error(s).");
        this.result = result;
    }

    public ImportResult getResult() {
        return result;
    }
}
