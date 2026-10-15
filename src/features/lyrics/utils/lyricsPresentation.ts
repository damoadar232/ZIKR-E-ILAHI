import { artists, lyricBooks, lyricCategories, poets } from "../../../lyricsData";

export function getLyricCategoryNames(item: any) {
    return (item.categoryIds || []).map((categoryId: string) => lyricCategories.find((category) => category.id === categoryId)?.name || categoryId).filter(Boolean);
}

export function getLyricArtistName(item: any) {
    return artists.find((artist) => artist.id === item.artistId)?.name || item.artist || "Unknown artist";
}

export function getLyricWriterName(item: any) {
    return poets.find((poet) => poet.id === item.writerId)?.name || item.writer || "Unknown writer";
}

export function getLyricBookName(item: any) {
    return item.bookId ? lyricBooks.find((book) => book.id === item.bookId)?.title || "" : "";
}

export function formatLyricDate(date: string | undefined) {
    if (!date) return "Recently published";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getPrimaryLanguage(item: any) {
    const preferred = item.languageVersions?.[0];
    return preferred ? preferred.label : "Urdu";
}