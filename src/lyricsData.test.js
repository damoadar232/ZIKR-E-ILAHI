import test from "node:test";
import assert from "node:assert/strict";
import { filterLyricsByTitle, getPublishedLyrics, lyrics } from "./lyricsData.js";

test("published lyrics retain newest-first order and title-only search works", () => {
    const published = getPublishedLyrics(lyrics);
    assert.ok(published.length > 0);
    assert.equal(published[0].title, "786 Durood");
    assert.equal(published[0].createdAt, "2025-05-16T10:00:00Z");

    const matches = filterLyricsByTitle(published, "mustafa", "All");
    assert.equal(matches.length, 1);
    assert.equal(matches[0].title, "Mustafa Jaan-e-Rehmat");

    const initial = filterLyricsByTitle(published, "", "M");
    assert.ok(initial.some((item) => item.title.startsWith("M")));
    assert.ok(!initial.some((item) => item.title.startsWith("A")));
});
