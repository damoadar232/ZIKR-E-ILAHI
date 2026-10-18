# Lyrics Persistence Contract

## Data and identifiers

`lyrics.id` is the internal numeric key. `lyrics.legacy_id` preserves the string identifiers used by the current frontend (for example, `786-durood`) and `slug` preserves its URL identifier. The migration seeds only the existing category and subject taxonomies; it does not import or invent lyric records. There is no production lyric SQL dataset in this repository. Before importing browser-demo content, export and review it separately, map each frontend ID to `legacy_id`, and explicitly map frontend `en` to database `roman`.

Categories and subjects use the current stable string IDs and restrictive join-table foreign keys. Artist IDs, display reciter names, writer ID/name, book ID, tags, featured state, cover image URL, and related audio/video references are retained as lyric metadata. The backend taxonomy tables do not attempt to make artist or book records that do not currently exist in the backend.

## Language versions and document JSON

There is at most one current row per `(lyric_id, language_code)`. Database language codes are `ur`, `hi`, and `roman`; `LyricLanguageCode.fromEditorCode("en")` is the compatibility mapping for the existing Roman-English frontend code. Draft lyrics may have no language rows or only a subset of languages.

Documents are stored as MySQL `JSON` and mapped to Jackson `JsonNode`, not polymorphic Java objects or HTML. The configured editor contract is:

- Nodes: `doc`, `paragraph`, `text`, `hardBreak`.
- Marks: `bold`, `italic`, `underline`, `strike`, `textStyle`, `highlight`.
- `textStyle` attributes: `color` as a six-digit hex color, `fontFamily` from `Noto Nastaliq Urdu`, `Noto Sans Devanagari`, `DM Sans`, or `Georgia`, and `fontSize` from 14px through 36px in the supported steps.
- `highlight` attribute: optional six-digit hex `color`.
- Paragraph attributes: `textAlign` in `left`, `center`, `right`, `justify`; `paragraphSpacing` in 8px, 16px, 24px, or 32px.

The API validator and JPA lifecycle callbacks check the recursive node/mark/attribute allowlists, bounds, and normalized non-empty text, including when repositories are used directly. The database's JSON type guarantees syntactic JSON only; it does not make arbitrary JSON a valid editor document.

## Revisions and deletion policy

When a current language version is updated through `LyricPersistenceService`, the service and new version are written in one transaction. Before changing the current document, it snapshots the prior document, optional plain text, publication status, language, lyric title/slug, and prior update timestamp. Metadata-only changes to the lyric are not revisioned in this phase. Revision foreign keys use restrictive deletion; lyrics, language versions, categories, and subjects cannot be removed while referenced. Admin deletion sets attribution references to null without deleting snapshots.

Timestamps use the backend's existing `LocalDateTime` convention and database `DATETIME` columns. No REST endpoint or public response serializes these persistence entities; future APIs must map them to explicit DTOs.

## Validation status

The regular Spring Boot tests execute all Flyway migrations with the existing H2 MySQL-mode test profile and verify persistence constraints. `MySqlLyricMigrationTest` is an optional MySQL 8.4 Testcontainers check and is skipped when Docker is unavailable. It should be run in CI or another environment with a working Docker daemon before deploying V9 to MySQL.