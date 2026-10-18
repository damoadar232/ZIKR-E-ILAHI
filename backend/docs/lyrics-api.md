# Lyrics API

All responses use the existing `ApiResponse` envelope (`data`, `error`, `message`). Persistence entities are mapped to DTOs; credentials, administrator relationships, and revision snapshots are never included in public responses.

## Public

`GET /api/v1/lyrics?page=0&size=20&category=naat-sharif&reciter=owais&poet=imam-ahmed-raza-khan&language=roman`

Filters are optional. Page is zero-based and size is 1–100. Only published lyrics and published language versions are returned. A successful list has this shape:

```json
{
  "data": {
    "items": [
      {
        "id": "mustafa-jaan-e-rehmat",
        "title": "Mustafa Jaan-e-Rehmat",
        "languageVersions": [
          {
            "code": "roman",
            "label": "Roman English",
            "script": "Roman",
            "dir": "ltr",
            "document": { "type": "doc", "content": [] },
            "text": "..."
          }
        ]
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

`GET /api/v1/lyrics/{reference}` accepts the stable frontend `legacyId`, slug, or numeric database ID. Draft lyrics and lyrics without public status return 404.

## Admin

All `/api/v1/admin/lyrics/**` routes use the existing JWT filter and require `ADMIN` or `SUPER_ADMIN`.

- `POST /api/v1/admin/lyrics` creates metadata as `DRAFT` and returns 201.
- `GET /api/v1/admin/lyrics?page=0&size=20&status=DRAFT&query=naat` lists drafts and published records.
- `GET /api/v1/admin/lyrics/{reference}` loads metadata and each language status.
- `PUT /api/v1/admin/lyrics/{reference}` replaces editable metadata while retaining status and all language versions.
- `PUT /api/v1/admin/lyrics/{reference}/languages/{languageCode}` saves exactly one language document and returns that language to `DRAFT` for review. Codes are `ur`, `hi`, and `roman`.
- `PATCH /api/v1/admin/lyrics/{reference}/languages/{languageCode}/status` publishes or drafts one language independently.
- `PATCH /api/v1/admin/lyrics/{reference}/status` publishes a lyric only when at least one language version is published; setting it to draft immediately hides it publicly.
- `GET /api/v1/admin/lyrics/{reference}/languages/{languageCode}/revisions` returns that language's prior snapshots, newest first.
- `DELETE /api/v1/admin/lyrics/{reference}` returns 204 only when no language versions exist. Otherwise it returns 409 to preserve content and revision history; unpublish instead.

Admin metadata requests accept the existing lyric identifiers and fields: title, slug, artist/writer IDs, reciter names, category/subject IDs, tags, book ID, image URL, featured state, and related media references. Unknown category or subject IDs are rejected. The server derives audit administrators from the authenticated JWT principal and ignores administrator IDs from request bodies.

A language request contains `{ "document": <Tiptap JSON>, "changeNote": "optional" }`. The server enforces the documented node, mark, font, color, size, alignment, paragraph spacing, document-size, text-size, and non-empty-content rules before storage. JSON is never treated as HTML. The request body limit for lyric admin writes is 512 KiB; each document is limited to 256 KiB.

Validation failures return 400, missing records 404, uniqueness/optimistic conflicts and unsafe deletes 409, unauthenticated requests 401, unauthorized roles 403, and oversized requests 413. Unexpected failures return the existing generic error envelope without database details or stack traces.
