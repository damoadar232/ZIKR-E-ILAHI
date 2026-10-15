import { useEffect, useRef, useState } from "react";
import { getPublishedLyrics, lyrics as lyricLibrary, lyricCategories, artists, poets, lyricBooks, lyricSubjects, filterLyricsByTitle, getLyricsByCategory, getLyricsByArtist, getLyricsByPoet, getLyricsByBook, getLyricsByLanguage, getLyricsBySubject } from "../../../lyricsData";
import { interfaceAttributeText, LocalizedText, useInterfaceText } from "../../../app/providers/interfaceLanguage";
import { getRouteQueryParam } from "../../../app/utils/getRouteQueryParam";
import { DirectoryHeader, SearchBox } from "../../../components/common/PagePrimitives";
import { SectionHead } from "../../../components/common/SectionHead";
import { Icon } from "../../../components/ui";
import { LyricsCard } from "../components/LyricsCard";

export const lyricsRoutePaths = ["lyrics", "lyrics-category", "lyrics-artists", "lyrics-poets", "lyrics-books", "lyrics-languages", "lyrics-subjects"];

const lyricsBrowseItems = [
    ["All Lyrics", "lyrics"],
    ["Categories", "lyrics-category"],
    ["Naat-Khwaan / Reciters", "lyrics-artists"],
    ["Poets", "lyrics-poets"],
    ["Books", "lyrics-books"],
    ["Language", "lyrics-languages"],
    ["Subject / Occasion", "lyrics-subjects"],
] as const;

type LyricsBrowseEntry = { id: string; name: string; lyrics: any[] };
type LyricsBrowseConfig = { title: string; heading: string; parameter: string; noun: string; entries: LyricsBrowseEntry[] };

function matchesLyricsLetter(value: string, letter: string) {
    if (letter === "All") return true;
    const firstMeaningful = (value || "").match(/[A-Za-z0-9]/)?.[0] || "";
    if (!firstMeaningful) return false;
    return letter === "0-9" ? /\d/.test(firstMeaningful) : firstMeaningful.toUpperCase() === letter;
}

function LyricsBrowseControl({ go, active }: { go: (route: string) => void; active: string }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const t = useInterfaceText();
    useEffect(() => {
        if (!open) return;
        const closeOnOutsidePointer = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsidePointer);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsidePointer);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    return <div className="lyrics-browse-wrap" ref={menuRef}>
        <button type="button" className="lyrics-browse-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>{t("Browse")} <Icon name="chevron" size={14} /></button>
        {open && <div className="lyrics-browse-menu" role="menu" aria-label={interfaceAttributeText("Lyrics browse destinations")}>{lyricsBrowseItems.map(([label, route]) => <button key={route} type="button" role="menuitem" className={active === route ? "active" : ""} onClick={() => { go(route); setOpen(false); }}>{t(label)}</button>)}</div>}
    </div>;
}

function renderLyricCards(items: any[], go: (route: string) => void) {
    return <div className="lyrics-list">{items.map((item, index) => <LyricsCard item={item} index={index} key={item.id} onClick={() => go(`lyric-detail?id=${item.id}`)} />)}</div>;
}

export function LyricsPage({ go, route }: { go: (route: string) => void; route: string }) {
    const [search, setSearch] = useState("");
    const [letter, setLetter] = useState("All");
    const activeRoute = route.split("?")[0];
    const published = getPublishedLyrics(lyricLibrary);
    const query = search.trim().toLowerCase();
    const optionConfig: Record<string, LyricsBrowseConfig> = {
        "lyrics-category": { title: "Categories", heading: "Browse by Category", parameter: "category", noun: "categories", entries: lyricCategories.map(entry => ({ id: entry.id, name: entry.name, lyrics: getLyricsByCategory(published, entry.id) })) },
        "lyrics-artists": { title: "Naat-Khwaan / Reciters", heading: "Browse by Reciter", parameter: "artist", noun: "reciters", entries: artists.map(entry => ({ id: entry.id, name: entry.name, lyrics: getLyricsByArtist(published, entry.id) })) },
        "lyrics-poets": { title: "Poets", heading: "Browse by Poet", parameter: "poet", noun: "poets", entries: poets.map(entry => ({ id: entry.id, name: entry.name, lyrics: getLyricsByPoet(published, entry.id) })) },
        "lyrics-books": { title: "Books", heading: "Browse by Source", parameter: "book", noun: "books", entries: lyricBooks.map(entry => ({ id: entry.id, name: entry.title, lyrics: getLyricsByBook(published, entry.id) })) },
        "lyrics-languages": { title: "Language", heading: "Browse by Language", parameter: "language", noun: "languages", entries: Array.from(new Map<string, string>(published.flatMap(lyric => lyric.languageVersions || []).map(version => [version.code, version.label] as [string, string])).entries()).map(([id, name]) => ({ id, name, lyrics: getLyricsByLanguage(published, id) })) },
        "lyrics-subjects": { title: "Subject / Occasion", heading: "Browse by Subject or Occasion", parameter: "subject", noun: "subjects", entries: lyricSubjects.map(entry => ({ id: entry.id, name: entry.name, lyrics: getLyricsBySubject(published, entry.id) })) },
    };
    const config = optionConfig[activeRoute];
    const selectedId = config ? getRouteQueryParam(config.parameter) : "";
    const selected = config?.entries.find(entry => entry.id === selectedId);
    const overview = activeRoute !== "lyrics" && (!config || !selected);

    useEffect(() => {
        setSearch("");
        setLetter("All");
    }, [activeRoute, selectedId]);

    const placeholder = activeRoute === "lyrics" ? "Search lyric titles" : selected ? `Search ${selected.name} lyrics` : config ? `Search ${config.title.toLowerCase()} and lyrics` : "Search lyric titles";
    const matchesSearchAndLetter = (item: any) => {
        const entityName = selected?.name.toLowerCase() || "";
        return (!query || item.title.toLowerCase().includes(query) || entityName.includes(query)) && matchesLyricsLetter(item.title, letter);
    };
    const selectedLyrics = selected ? selected.lyrics.filter(matchesSearchAndLetter) : [];
    const directoryEntries = config?.entries.filter(entry => matchesLyricsLetter(entry.name, letter) && (!query || entry.name.toLowerCase().includes(query) || entry.lyrics.some(item => item.title.toLowerCase().includes(query)))) || [];
    const allLyrics = filterLyricsByTitle(published, search, letter);
    const selectRoute = (nextRoute: string) => {
        setSearch("");
        setLetter("All");
        go(nextRoute);
    };
    const returnToOverview = () => selectRoute(activeRoute);
    const clearFilters = () => { setSearch(""); setLetter("All"); };
    const resultLyrics = activeRoute === "lyrics" ? allLyrics : selectedLyrics;
    const resultTitle = activeRoute === "lyrics" ? "Recently Published" : selected ? `${selected.name} lyrics` : "Matching Lyrics";
    const resultEyebrow = `${resultLyrics.length} ${resultLyrics.length === 1 ? "work" : "works"}`;
    const emptyMessage = activeRoute === "lyrics" ? "No lyrics match those filters." : `No lyrics match this ${config?.title.toLowerCase() || "category"} selection.`;
    const renderEmpty = (message: string, help: string) => <div className="empty"><Icon name="search" size={32} /><h3>{message}</h3><p><LocalizedText text={help} /></p><button className="btn btn-primary" onClick={clearFilters}><LocalizedText text={"Clear filters"} /></button></div>;

    return <main><DirectoryHeader go={go} title={interfaceAttributeText("Devotional Lyrics")} text="Discover words of praise and devotion across languages, traditions, and beloved voices." /><div className="container directory-controls"><div className="lyrics-search-row"><SearchBox value={search} setValue={setSearch} placeholder={placeholder} /><LyricsBrowseControl go={selectRoute} active={activeRoute} /></div><div className="alphabet" aria-label={interfaceAttributeText("Filter by first letter")}><button className={letter === "All" ? "active" : ""} onClick={() => setLetter("All")}><LocalizedText text={"All"} /></button>{["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(option => <button key={option} className={letter === option ? "active" : ""} onClick={() => setLetter(option)}>{option === "0-9" ? "0–9" : option}</button>)}</div></div>
        {activeRoute === "lyrics" ? <section className="section container"><SectionHead eyebrow={resultEyebrow} title={resultTitle} />{resultLyrics.length ? renderLyricCards(resultLyrics, go) : renderEmpty(emptyMessage, "Try another title or letter, or reset the filters.")}</section> : <>
            {overview && config && <section className="section container"><SectionHead eyebrow={`${directoryEntries.length} ${config.noun}`} title={config.heading} />{directoryEntries.length ? <div className="library-directory-grid">{directoryEntries.map(entry => <button key={entry.id} onClick={() => selectRoute(`${activeRoute}?${config.parameter}=${encodeURIComponent(entry.id)}`)}><span>{entry.name}</span><small>{entry.lyrics.length} {entry.lyrics.length === 1 ? "title" : "titles"}</small></button>)}</div> : renderEmpty(`No ${config.noun} match those filters.`, "Try another search or letter.")}</section>}
            {selected && <section className="section container"><SectionHead eyebrow={resultEyebrow} title={resultTitle} action={`Back to ${config.heading}`} onAction={returnToOverview} />{resultLyrics.length ? renderLyricCards(resultLyrics, go) : renderEmpty(emptyMessage, "Try another title or letter, or return to the overview.")}</section>}
            {!config && <section className="section container"><SectionHead eyebrow="Lyrics library" title={interfaceAttributeText("Recently Published")} />{allLyrics.length ? renderLyricCards(allLyrics, go) : renderEmpty(emptyMessage, "Try another title or letter, or reset the filters.")}</section>}
        </>}</main>;
}
