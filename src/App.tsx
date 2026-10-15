import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Outlet, Route as RouterRoute, Routes, useLocation, useNavigate } from "react-router-dom";
import { InterfaceLanguageContext, interfaceAttributeText, LocalizedText, useInterfaceLanguage, useInterfaceText } from "./app/providers/interfaceLanguage";
import { photos } from "./app/config/media";
import { isAvailableDownloadUrl } from "./app/utils/downloadUrl";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { Btn, Icon, type IconName, Logo } from "./components/ui";
import { Reveal } from "./components/common/Reveal";
import { SectionHead } from "./components/common/SectionHead";
import { Breadcrumbs, CategoryBrowseControl, DirectoryHeader, PageHero, SearchBox, Tabs } from "./components/common/PagePrimitives";
import { Home } from "./features/home/pages/Home";
import { ServicesPage } from "./features/services-page/pages/ServicesPage";
import { AboutPage } from "./features/about/pages/AboutPage";
import { ContactPage } from "./features/contact/pages/ContactPage";
import { AuthPage } from "./features/auth/pages/AuthPage";
import { AdminPage } from "./features/admin/pages/AdminPage";
import { AudioPage, AudioDetail } from "./features/audio/pages/AudioPages";
import { Ebooks, BookDetail, BookReader } from "./features/ebooks/pages/EbookPages";
import { AudioCard, getAudioCategoryLabel } from "./features/audio/components/AudioCard";
import { BookCard } from "./features/ebooks/components/BookCard";
import { LyricsCard } from "./features/lyrics/components/LyricsCard";
import { LyricsPage, lyricsRoutePaths } from "./features/lyrics/pages/LyricsPage";
import { formatLyricDate, getLyricArtistName, getLyricBookName, getLyricCategoryNames, getLyricWriterName } from "./features/lyrics/utils/lyricsPresentation";
import { getRouteQueryParam } from "./app/utils/getRouteQueryParam";
import { audioCategories, audioLibrary, filterAudioLibrary, getAudioById } from "./audioData";
import { ebookCategories, ebookLibrary, filterEbooks, getEbookById } from "./bookData";
import { clearPendingAction, createPendingAction, readPendingAction, savePendingAction, safeReturnTo } from "./authActions.js";
import { FONT_SCALE_KEY, GLOBAL_LANGUAGE_KEY, THEME_KEY, readPreference, translateInterface } from "./interfacePreferences";
import { lookupWordMeanings } from "./wordMeaningService";
import { audioSources, ayahAudioSources, ayahContent, juzStarts, mushafPageStarts, surahMeanings, translationResources, type TranslationLanguage } from "./quranData";
import {
  artists,
  lyricBooks,
  lyricCategories,
  lyricSubjects,
  lyrics as lyricLibrary,
  poets,
  getPublishedLyrics,
  filterLyricsByTitle,
  findLyricById,
  getLyricsByCategory,
  getLyricsByArtist,
  getLyricsByPoet,
  getLyricsByBook,
  getLyricsByLanguage,
  getLyricsBySubject,
} from "./lyricsData";

type Route = string;

const quranBrowseItems = [
  "Quran Home",
  "Surah Directory",
  "Para Directory",
  "Makki / Madani",
  "Topics",
  "Quranic Quotes",
  "Audio Quran",
] as const;

const quranBrowseMap: Record<(typeof quranBrowseItems)[number], Route> = {
  "Quran Home": "quran",
  "Surah Directory": "surahs",
  "Para Directory": "para",
  "Makki / Madani": "surahs",
  "Topics": "quran-topics?view=topics",
  "Quranic Quotes": "quran-topics?view=quotes",
  "Audio Quran": "audio",
};

const quranRouteToBrowseValue: Record<string, (typeof quranBrowseItems)[number]> = {
  quran: "Quran Home",
  surahs: "Surah Directory",
  para: "Para Directory",
  "quran-topics": "Topics",
  audio: "Audio Quran",
  "audio-detail": "Audio Quran",
  "surah-read": "Surah Directory",
};

function getQuranSearchPlaceholder(category: (typeof quranBrowseItems)[number]) {
  switch (category) {
    case "Quran Home":
      return "Search the Quran home collection";
    case "Surah Directory":
      return "Find a Surah by name or number";
    case "Para Directory":
      return "Find a Para by number or name";
    case "Makki / Madani":
      return "Filter Makki or Madani Surahs";
    case "Topics":
      return "Search Quran topics";
    case "Quranic Quotes":
      return "Search Quranic quotes";
    case "Audio Quran":
      return "Search Quran recitations";
    default:
      return "Search Quran";
  }
}

function filterQuranSurahs(items: string[][], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => `${item[0]} ${item[1]} ${item[2]} ${item[3]} ${item[4]}`.toLowerCase().includes(normalized));
}

function filterQuranParas(items: { number: number; label: string; surahName: string; arabicName: string }[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => `${item.number} ${item.label} ${item.surahName} ${item.arabicName}`.toLowerCase().includes(normalized));
}

function QuranSearchAndBrowse({ search, setSearch, activeCategory, onSelectCategory }: { search: string; setSearch: (value: string) => void; activeCategory: (typeof quranBrowseItems)[number]; onSelectCategory: (value: string) => void; }) {
  return <div className="container directory-controls"><div className="lyrics-search-row quran-home-search-row"><SearchBox value={search} setValue={setSearch} placeholder={getQuranSearchPlaceholder(activeCategory)} /><CategoryBrowseControl items={[...quranBrowseItems]} value={activeCategory} onChange={onSelectCategory} /></div></div>;
}

const surahData = [
  ["الفاتحة", "Al-Fatihah", 7, "Makki"], ["البقرة", "Al-Baqarah", 286, "Madani"], ["آل عمران", "Ali 'Imran", 200, "Madani"], ["النساء", "An-Nisa", 176, "Madani"], ["المائدة", "Al-Ma'idah", 120, "Madani"], ["الأنعام", "Al-An'am", 165, "Makki"], ["الأعراف", "Al-A'raf", 206, "Makki"], ["الأنفال", "Al-Anfal", 75, "Madani"], ["التوبة", "At-Tawbah", 129, "Madani"], ["يونس", "Yunus", 109, "Makki"], ["هود", "Hud", 123, "Makki"], ["يوسف", "Yusuf", 111, "Makki"],
  ["الرعد", "Ar-Ra'd", 43, "Madani"], ["إبراهيم", "Ibrahim", 52, "Makki"], ["الحجر", "Al-Hijr", 99, "Makki"], ["النحل", "An-Nahl", 128, "Makki"], ["الإسراء", "Al-Isra", 111, "Makki"], ["الكهف", "Al-Kahf", 110, "Makki"], ["مريم", "Maryam", 98, "Makki"], ["طه", "Taha", 135, "Makki"], ["الأنبياء", "Al-Anbiya", 112, "Makki"], ["الحج", "Al-Hajj", 78, "Madani"], ["المؤمنون", "Al-Mu'minun", 118, "Makki"], ["النور", "An-Nur", 64, "Madani"],
  ["الفرقان", "Al-Furqan", 77, "Makki"], ["الشعراء", "Ash-Shu'ara", 227, "Makki"], ["النمل", "An-Naml", 93, "Makki"], ["القصص", "Al-Qasas", 88, "Makki"], ["العنكبوت", "Al-Ankabut", 69, "Makki"], ["الروم", "Ar-Rum", 60, "Makki"], ["لقمان", "Luqman", 34, "Makki"], ["السجدة", "As-Sajdah", 30, "Makki"], ["الأحزاب", "Al-Ahzab", 73, "Madani"], ["سبأ", "Saba", 54, "Makki"], ["فاطر", "Fatir", 45, "Makki"], ["يس", "Ya-Sin", 83, "Makki"],
  ["الصافات", "As-Saffat", 182, "Makki"], ["ص", "Sad", 88, "Makki"], ["الزمر", "Az-Zumar", 75, "Makki"], ["غافر", "Ghafir", 85, "Makki"], ["فصلت", "Fussilat", 54, "Makki"], ["الشورى", "Ash-Shuraa", 53, "Makki"], ["الزخرف", "Az-Zukhruf", 89, "Makki"], ["الدخان", "Ad-Dukhan", 59, "Makki"], ["الجاثية", "Al-Jathiyah", 37, "Makki"], ["الأحقاف", "Al-Ahqaf", 35, "Makki"], ["محمد", "Muhammad", 38, "Madani"], ["الفتح", "Al-Fath", 29, "Madani"],
  ["الحجرات", "Al-Hujurat", 18, "Madani"], ["ق", "Qaf", 45, "Makki"], ["الذاريات", "Adh-Dhariyat", 60, "Makki"], ["الطور", "At-Tur", 49, "Makki"], ["النجم", "An-Najm", 62, "Makki"], ["القمر", "Al-Qamar", 55, "Makki"], ["الرحمن", "Ar-Rahman", 78, "Madani"], ["الواقعة", "Al-Waqi'ah", 96, "Makki"], ["الحديد", "Al-Hadid", 29, "Madani"], ["المجادلة", "Al-Mujadilah", 22, "Madani"], ["الحشر", "Al-Hashr", 24, "Madani"], ["الممتحنة", "Al-Mumtahanah", 13, "Madani"],
  ["الصف", "As-Saff", 14, "Madani"], ["الجمعة", "Al-Jumu'ah", 11, "Madani"], ["المنافقون", "Al-Munafiqun", 11, "Madani"], ["التغابن", "At-Taghabun", 18, "Madani"], ["الطلاق", "At-Talaq", 12, "Madani"], ["التحريم", "At-Tahrim", 12, "Madani"], ["الملك", "Al-Mulk", 30, "Makki"], ["القلم", "Al-Qalam", 52, "Makki"], ["الحاقة", "Al-Haqqah", 52, "Makki"], ["المعارج", "Al-Ma'arij", 44, "Makki"], ["نوح", "Nuh", 28, "Makki"], ["الجن", "Al-Jinn", 28, "Makki"],
  ["المزمل", "Al-Muzzammil", 20, "Makki"], ["المدثر", "Al-Muddaththir", 56, "Makki"], ["القيامة", "Al-Qiyamah", 40, "Makki"], ["الإنسان", "Al-Insan", 31, "Madani"], ["المرسلات", "Al-Mursalat", 50, "Makki"], ["النبأ", "An-Naba", 40, "Makki"], ["النازعات", "An-Nazi'at", 46, "Makki"], ["عبس", "Abasa", 42, "Makki"], ["التكوير", "At-Takwir", 29, "Makki"], ["الإنفطار", "Al-Infitar", 19, "Makki"], ["المطففين", "Al-Mutaffifin", 36, "Makki"], ["الإنشقاق", "Al-Inshiqaq", 25, "Makki"],
  ["البروج", "Al-Buruj", 22, "Makki"], ["الطارق", "At-Tariq", 17, "Makki"], ["الأعلى", "Al-A'la", 19, "Makki"], ["الغاشية", "Al-Ghashiyah", 26, "Makki"], ["الفجر", "Al-Fajr", 30, "Makki"], ["البلد", "Al-Balad", 20, "Makki"], ["الشمس", "Ash-Shams", 15, "Makki"], ["الليل", "Al-Layl", 21, "Makki"], ["الضحى", "Ad-Duhaa", 11, "Makki"], ["الشرح", "Ash-Sharh", 8, "Makki"], ["التين", "At-Tin", 8, "Makki"], ["العلق", "Al-Alaq", 19, "Makki"],
  ["القدر", "Al-Qadr", 5, "Makki"], ["البينة", "Al-Bayyinah", 8, "Madani"], ["الزلزلة", "Az-Zalzalah", 8, "Madani"], ["العاديات", "Al-Adiyat", 11, "Makki"], ["القارعة", "Al-Qari'ah", 11, "Makki"], ["التكاثر", "At-Takathur", 8, "Makki"], ["العصر", "Al-Asr", 3, "Makki"], ["الهمزة", "Al-Humazah", 9, "Makki"], ["الفيل", "Al-Fil", 5, "Makki"], ["قريش", "Quraysh", 4, "Makki"], ["الماعون", "Al-Ma'un", 7, "Makki"], ["الكوثر", "Al-Kawthar", 3, "Makki"],
  ["الكافرون", "Al-Kafirun", 6, "Makki"], ["النصر", "An-Nasr", 3, "Madani"], ["المسد", "Al-Masad", 5, "Makki"], ["الإخلاص", "Al-Ikhlas", 4, "Makki"], ["الفلق", "Al-Falaq", 5, "Makki"], ["الناس", "An-Nas", 6, "Makki"],
] as const;
const surahs = surahData.map((surah, index) => [String(index + 1).padStart(2, "0"), surah[0], surah[1], `${surah[2]} Ayat`, surah[3]]);

function PublicLayout({ route, go, language, setLanguage, theme, setTheme, fontScale, setFontScale }: { route: Route; go: (r: Route) => void; language: string; setLanguage: (value: string) => void; theme: string; setTheme: (value: string) => void; fontScale: number; setFontScale: (value: number) => void }) {
  return <>
    <Header route={route} go={go} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} fontScale={fontScale} setFontScale={setFontScale} />
    <Outlet />
    <Footer go={go} />
  </>;
}

function BareLayout() {
  return <Outlet />;
}

function NotFound({ go }: { go: (r: Route) => void }) {
  return <main className="reading-bg"><div className="container narrow"><div className="empty"><h1>Page not found</h1><p><LocalizedText text={"The page you requested could not be found."} /></p><button className="btn btn-primary" onClick={() => go("home")}><LocalizedText text={"Back to Home"} /></button></div></div></main>;
}

function LyricWordEnhancer({ language }: { language: string }) {
  useEffect(() => {
    const textContainer = document.querySelector<HTMLElement>(".lyric-detail-page .lyrics-text");
    if (!textContainer) return;
    let activeController: AbortController | null = null;
    let panel: HTMLDivElement | null = null;
    const wordPattern = /[\p{L}\p{M}\p{N}]+(?:[-'’][\p{L}\p{M}\p{N}]+)*/gu;

    const closePanel = () => {
      activeController?.abort();
      activeController = null;
      panel?.remove();
      panel = null;
    };
    const showPanel = async (word: string, rect: DOMRect) => {
      closePanel();
      panel = document.createElement("div");
      panel.className = "word-meaning-popover";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", `Meanings for ${word}`);
      panel.setAttribute("aria-live", "polite");
      const title = document.createElement("div");
      title.className = "word-meaning-heading";
      const selectedWord = document.createElement("b");
      selectedWord.lang = textContainer.lang;
      selectedWord.textContent = word;
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", translateInterface(language, "Close"));
      closeButton.textContent = "×";
      closeButton.addEventListener("click", closePanel);
      title.append(selectedWord, closeButton);
      panel.append(title);
      for (const [code, label] of [["en", "English"], ["hi", "Hindi"], ["ur", "Urdu"]]) {
        const row = document.createElement("p");
        row.lang = code;
        row.dir = code === "ur" ? "rtl" : "ltr";
        const languageLabel = document.createElement("span");
        languageLabel.textContent = label;
        const value = document.createElement("b");
        value.textContent = translateInterface(language, "Loading");
        row.append(languageLabel, value);
        panel.append(row);
      }
      const attribution = document.createElement("small");
      attribution.textContent = "Translations via MyMemory";
      panel.append(attribution);
      document.body.append(panel);
      const activePanel = panel;
      panel.style.left = `${Math.max(12, Math.min(window.innerWidth - 332, rect.left + rect.width / 2 - 160))}px`;
      panel.style.top = `${Math.min(window.innerHeight - 220, rect.bottom + 8)}px`;

      activeController = new AbortController();
      try {
        const meanings = await lookupWordMeanings(word, textContainer.lang || "en", activeController.signal);
        if (panel !== activePanel) return;
        panel.querySelectorAll("p b").forEach((value, index) => {
          value.textContent = meanings[(["en", "hi", "ur"] as const)[index]] || translateInterface(language, "Meaning not available");
        });
      } catch {
        if (panel === activePanel) panel.querySelectorAll("p b").forEach((value) => { value.textContent = translateInterface(language, "Meaning not available"); });
      }
    };

    const openAtTextOffset = (node: Node | null, offset: number) => {
      if (!node || node.nodeType !== Node.TEXT_NODE || !textContainer.contains(node)) return;
      if ((node.parentElement as HTMLElement | null)?.closest("aside")) return;
      const source = node.textContent || "";
      wordPattern.lastIndex = 0;
      for (const match of source.matchAll(wordPattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        if (offset < start || offset > end) continue;
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, end);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        void showPanel(match[0], range.getBoundingClientRect());
        return;
      }
    };
    const onClick = (event: MouseEvent) => {
      if (window.getSelection() && !window.getSelection()!.isCollapsed) return;
      const caretRange = document.caretRangeFromPoint?.(event.clientX, event.clientY);
      const caretPosition = document.caretPositionFromPoint?.(event.clientX, event.clientY);
      openAtTextOffset(caretRange?.startContainer || caretPosition?.offsetNode || null, caretRange?.startOffset ?? caretPosition?.offset ?? 0);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
        return;
      }
      if (!textContainer.contains(event.target as Node)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const selection = window.getSelection();
      if (selection?.anchorNode && textContainer.contains(selection.anchorNode)) {
        event.preventDefault();
        openAtTextOffset(selection.anchorNode, selection.anchorOffset);
      }
    };
    const onOutsideClick = (event: PointerEvent) => {
      if (panel && !panel.contains(event.target as Node)) closePanel();
    };

    textContainer.tabIndex = 0;
    textContainer.setAttribute("role", "group");
    textContainer.setAttribute("aria-label", "Select a lyric word and press Enter to look up its meaning. Lyrics remain selectable.");
    textContainer.setAttribute("aria-keyshortcuts", "Enter Space");
    textContainer.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutsideClick);
    return () => {
      textContainer.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutsideClick);
      textContainer.removeAttribute("tabindex");
      textContainer.removeAttribute("role");
      textContainer.removeAttribute("aria-label");
      textContainer.removeAttribute("aria-keyshortcuts");
      closePanel();
    };
  }, [language]);

  return null;
}

function PendingActionNotice({ pendingAction, action, onContinue, onDismiss }: { pendingAction: any; action: string; onContinue: () => void; onDismiss: () => void }) {
  if (pendingAction?.action !== action) return null;
  return <div className="auth-pending-notice" role="status"><span><LocalizedText text={"Sign-in complete. Continue your pending action?"} /></span><div><button type="button" onClick={onContinue}><LocalizedText text={"Continue"} /></button><button type="button" onClick={onDismiss}><LocalizedText text={"Cancel"} /></button></div></div>;
}

function formatAudioTime(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function PersistentAudioPlayer({ track, onClose }: { track: (typeof audioLibrary)[number] | null; onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const speeds = [0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const player = audioRef.current;
    if (!track) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError("");
      if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
      return;
    }

    if (player) {
      player.src = track.source;
      player.load();
      player.playbackRate = playbackRate;
    }
    setCurrentTime(0);
    setDuration(0);
    setError("");
    setIsPlaying(false);
  }, [track?.id, playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  if (!track) return null;

  const currentIndex = audioLibrary.findIndex((entry) => entry.id === track.id);
  const previousTrack = currentIndex > 0 ? audioLibrary[currentIndex - 1] : null;
  const nextTrack = currentIndex >= 0 && currentIndex < audioLibrary.length - 1 ? audioLibrary[currentIndex + 1] : null;

  const togglePlayback = async () => {
    const player = audioRef.current;
    if (!player || !track.source) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await player.play();
      setIsPlaying(true);
    } catch {
      setError("This sample audio source could not play in your browser.");
    }
  };

  return <div className="shared-audio-player" role="region" aria-label={interfaceAttributeText("Persistent audio player")}><audio ref={audioRef} preload="metadata" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onEnded={() => setIsPlaying(false)} onError={() => { setError("The selected audio source is unavailable or blocked."); setIsPlaying(false); }} /><div className="shared-player-meta"><b>{track.title}</b><small>{track.artist}</small></div><div className="shared-player-controls"><button aria-label={interfaceAttributeText("Previous track")} disabled={!previousTrack} onClick={() => window.dispatchEvent(new CustomEvent("zikr-select-audio", { detail: { id: previousTrack?.id } }))}>{"‹"}</button><button aria-label={interfaceAttributeText(isPlaying ? "Pause audio" : "Play audio")} className="main" onClick={() => void togglePlayback()}>{isPlaying ? "Ⅱ" : <Icon name="play" size={18} />}</button><button aria-label={interfaceAttributeText("Next track")} disabled={!nextTrack} onClick={() => window.dispatchEvent(new CustomEvent("zikr-select-audio", { detail: { id: nextTrack?.id } }))}>{"›"}</button><input aria-label={interfaceAttributeText("Audio progress")} type="range" min="0" max={duration || 100} value={Math.min(currentTime, duration || 100)} onChange={(event) => { const player = audioRef.current; if (!player) return; player.currentTime = Number(event.target.value); setCurrentTime(Number(event.target.value)); }} /><span>{formatAudioTime(currentTime)}</span><span className="divisor">/</span><span>{duration ? formatAudioTime(duration) : "0:00"}</span></div><div className="shared-player-speed"><button aria-label={interfaceAttributeText("Close player")} className="close-player" onClick={onClose}>×</button>{speeds.map((speed) => <button key={speed} type="button" className={playbackRate === speed ? "active" : ""} onClick={() => setPlaybackRate(speed)} aria-label={`Set playback speed to ${speed} times`}>{speed}×</button>)}</div>{error && <div className="player-error"><LocalizedText text={error} /></div>}</div>;
}

function LyricDetail({ go }: { go: (r: Route) => void }) {
  const t = useInterfaceText();
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const lyricId = getRouteQueryParam("id");
  const lyric = findLyricById(lyricId) || getPublishedLyrics(lyricLibrary)[0];
  const [selectedLanguage, setSelectedLanguage] = useState(() => lyric?.languageVersions?.[0]?.code || "ur");

  useEffect(() => {
    if (!lyric) return;
    const next = lyric.languageVersions.some((entry) => entry.code === selectedLanguage) ? selectedLanguage : lyric.languageVersions[0]?.code || "ur";
    setSelectedLanguage(next);
  }, [lyric, selectedLanguage]);

  if (!lyric) {
    return <main className="reading-bg"><div className="container narrow"><Breadcrumbs items={["Lyrics", "Not found"]} go={go} /><div className="empty"><Icon name="book" size={32} /><h3><LocalizedText text={"Lyric not found"} /></h3><p><LocalizedText text={"The requested lyric is unavailable in the current library. Try browsing from the main Lyrics page."} /></p><button className="btn btn-primary" onClick={() => go("lyrics")}><LocalizedText text={"Back to all lyrics"} /></button></div></div></main>;
  }

  const version = lyric.languageVersions.find((entry) => entry.code === selectedLanguage) || lyric.languageVersions[0];
  const metadataFields = [
    ["Recited By", getLyricArtistName(lyric) || "Traditional"],
    ["Written By", getLyricWriterName(lyric) || "Traditional"],
    ["Published", formatLyricDate(lyric.createdAt)],
    ["Book", getLyricBookName(lyric) || "—"],
    ["Subject", lyric.subjectIds?.length ? lyricSubjects.find((subject) => subject.id === lyric.subjectIds[0])?.name || "—" : "—"],
  ] as const;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(version.text);
      setCopied(true);
      setShareMessage("");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setShareMessage("Clipboard access is unavailable in this browser.");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#lyric-detail?id=${lyric.id}`;
    const shareText = `${lyric.title}\n${version.text}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: lyric.title, text: shareText, url });
        setShareMessage("Share dialog opened.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage("Share link copied to your clipboard.");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage("Share was unavailable, so the page link was copied instead.");
      } catch {
        setShareMessage("Sharing is unavailable in this browser.");
      }
    }
  };

  const relatedLyrics = getPublishedLyrics(lyricLibrary).filter((entry) => entry.id !== lyric.id).slice(0, 2);

  return <main className="reading-bg"><div className="container narrow"><Breadcrumbs items={["Lyrics", lyric.title]} go={go} /><article className="lyric-reading lyric-detail-page"><span className="badge">{getLyricCategoryNames(lyric).map(t).join(" • ") || t("Devotional")}</span><h1>{lyric.title}</h1>{lyric.tags?.[0] ? <p className="lead">{lyric.tags[0]} <LocalizedText text={"and remembrance"} /></p> : null}<div className="lyric-toolbar"><div className="lyric-toolbar-left"><label className="lang-select"><span className="sr-only"><LocalizedText text={"Select language"} /></span><select aria-label={interfaceAttributeText("Select lyric language")} value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)}>{lyric.languageVersions.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}</select></label></div><div className="lyric-toolbar-actions"><Btn variant="outline" icon={copied ? "check" : "copy"} onClick={() => void copy()}>{copied ? "Copied" : "Copy Lyrics"}</Btn><Btn variant="outline" icon="share" onClick={() => void share()}><LocalizedText text={"Share"} /></Btn></div></div>{shareMessage && <div className="lyric-share-status"><LocalizedText text={shareMessage} /></div>}{lyric.tags?.length ? <div className="tag-row">{lyric.tags.map((tag) => <span key={tag} className="badge soft-badge">#{tag}</span>)}</div> : null}<div className="lyrics-text" lang={version.code} dir={version.dir || "ltr"}><p>{version.text.split("\n").map((line, index) => <span key={`${version.code}-${index}`}><span>{line}</span>{index < version.text.split("\n").length - 1 ? <br /> : null}</span>)}</p>{lyric.tags?.length ? <aside><LocalizedText text={"Keywords:"} trailing=" " />{lyric.tags.join(" • ")}</aside> : null}</div><div className="detail-meta-row">{metadataFields.map(([label, value]) => <div key={label} className="detail-meta-item"><small>{t(label)}</small><span>{value}</span></div>)}</div></article>{lyric.relatedAudio?.length ? <section className="related"><SectionHead title={interfaceAttributeText("Related Audio")} action="Back to Lyrics" onAction={() => go("lyrics")} /><div className="audio-grid light">{lyric.relatedAudio.map((item) => <article className="audio-card reveal" key={item.title}><div className="audio-art green"><div className="arch-art"><span>ذِكْر</span></div><button className="play-btn" aria-label={`Play ${item.title}`} onClick={() => window.open(item.url, "_blank", "noopener")}><Icon name="play" /></button></div><div className="audio-info"><span className="badge"><LocalizedText text={"Audio"} /></span><h3>{item.title}</h3><p><LocalizedText text={"Related to"} trailing=" " />{lyric.title}</p><div className="media-meta"><span><LocalizedText text={"Link"} /></span><span><LocalizedText text={"Available"} /></span></div></div></article>)}</div></section> : null}{lyric.relatedVideos?.length ? <section className="related"><SectionHead title={interfaceAttributeText("Related Videos")} /><div className="audio-grid light">{lyric.relatedVideos.map((video) => <article className="audio-card reveal" key={video.title}><div className="audio-art gold"><div className="arch-art"><span>▶</span></div><button className="play-btn" aria-label={`Open ${video.title}`} onClick={() => window.open(video.url, "_blank", "noopener")}><Icon name="play" /></button></div><div className="audio-info"><span className="badge"><LocalizedText text={"Video"} /></span><h3>{video.title}</h3><p><LocalizedText text={"YouTube reference"} /></p><div className="media-meta"><span><LocalizedText text={"Shareable"} /></span><span><LocalizedText text={"Watch"} /></span></div></div></article>)}</div></section> : null}<section className="related"><SectionHead title={interfaceAttributeText("Related Lyrics")} action="Read All Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{relatedLyrics.map((item, index) => <LyricsCard item={item} index={index} key={item.id} onClick={() => go(`lyric-detail?id=${item.id}`)} />)}</div></section></div></main>;
}

function QuranHome({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const filteredSurahs = filterQuranSurahs(surahs, search).slice(0, 6);
  const handleBrowseSelect = (item: (typeof quranBrowseItems)[number]) => {
    setSearch("");
    go(quranBrowseMap[item]);
  };

  return <main><PageHero eyebrow="THE HOLY QURAN" title={interfaceAttributeText("Read. Reflect. Return.")} text="A calm and respectful space to explore the Quran, Surah by Surah."><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory="Quran Home" onSelectCategory={handleBrowseSelect} /></PageHero><section className="section container"><div className="browse-cards"><button onClick={() => go("surahs")}><span>114</span><div><b><LocalizedText text={"Browse by Surah"} /></b><small><LocalizedText text={"Explore every chapter in order"} /></small></div><Icon name="arrow" /></button><button onClick={() => go("para")}><span>30</span><div><b><LocalizedText text={"Browse by Para"} /></b><small><LocalizedText text={"Read by Juz division"} /></small></div><Icon name="arrow" /></button></div><SectionHead eyebrow="Continue Exploring" title={interfaceAttributeText("Surahs of the Quran")} action="View all 114 Surahs" onAction={() => go("surahs")} /><SurahGrid go={go} items={search.trim() ? filteredSurahs : surahs.slice(0, 6)} /></section></main>;
}

function SurahGrid({ go, items = surahs }: { go: (r: Route) => void; items?: string[][] }) {
  const t = useInterfaceText();
  return <div className="surah-grid">{items.map(x => <button key={x[0]} onClick={() => go(`surah-read?surah=${Number(x[0])}&ayah=1`)}><span className="surah-no">{x[0]}</span><div><b>{x[2]}</b><small>{t(x[3])} • {t(x[4])}</small></div><strong lang="ar" dir="rtl">{x[1]}</strong></button>)}</div>;
}

function SurahDirectory({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const shown = filterQuranSurahs(surahs, search);
  const handleBrowseSelect = (item: (typeof quranBrowseItems)[number]) => {
    setSearch("");
    go(quranBrowseMap[item]);
  };

  return <main><DirectoryHeader go={go} title={interfaceAttributeText("Surah Directory")} text="Browse all 114 Surahs of the Holy Quran in their established order." /><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory="Surah Directory" onSelectCategory={handleBrowseSelect} /><section className="section container"><div className="directory-summary"><span>{shown.length} <LocalizedText text={"Surahs"} /></span><small><LocalizedText text={"Ordered from Al-Fatihah to An-Nas"} /></small></div><SurahGrid go={go} items={shown} /></section></main>;
}

function SurahRead({ go, isLoggedIn, onRequireAuthentication }: { go: (r: Route) => void; isLoggedIn: boolean; onRequireAuthentication: (action: string, contentType: string, contentId: string) => boolean }) {
  const navigate = useNavigate();
  const location = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const requestedSurah = Number(location.get("surah")) || 1;
  const initialSurah = Math.min(surahData.length, Math.max(1, requestedSurah));
  const [surahNumber, setSurahNumber] = useState(initialSurah);
  const [ayahNumber, setAyahNumber] = useState(() => {
    const chapter = surahData[initialSurah - 1];
    const requestedAyah = Number(location.get("ayah")) || 1;
    return Math.min(chapter[2], Math.max(1, requestedAyah));
  });
  const [selectedTranslation, setSelectedTranslation] = useState<TranslationLanguage>(() =>
    translationResources.find((resource) => resource.languageCode === getRouteQueryParam("translation"))?.languageCode || "en",
  );
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    if (params.get("translation") === selectedTranslation) return;
    params.set("translation", selectedTranslation);
    navigate(`/surah-read?${params.toString()}`, { replace: true });
  }, [navigate, selectedTranslation]);
  const [navOpen, setNavOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [navTab, setNavTab] = useState("Surah");
  const [surahSearch, setSurahSearch] = useState("");
  const [translationSearch, setTranslationSearch] = useState("");
  const [mode, setMode] = useState<"verses" | "reading">("verses");
  const [infoOpen, setInfoOpen] = useState(false);
  const [highlightedAyah, setHighlightedAyah] = useState(0);
  const [notice, setNotice] = useState("");
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("zikr-quran-bookmarks") || "[]") as number[]; }
    catch { return []; }
  });
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [activeAudioTitle, setActiveAudioTitle] = useState("");
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayahRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingNavigation = useRef<string | null>(null);
  const pendingAudioSeek = useRef<number | null>(null);
  const lastPlaybackAyah = useRef<number | null>(null);
  const chapter = surahData[surahNumber - 1];
  const chapterNumber = surahNumber;
  const [arabicName, transliteratedName, ayahCount, revelation] = chapter;
  const chapterContent = ayahContent[chapterNumber] || {};
  const filteredSurahs = surahData.map((item, index) => ({ item, number: index + 1 })).filter(({ item, number }) => `${number} ${item[0]} ${item[1]} ${surahMeanings[number - 1]}`.toLowerCase().includes(surahSearch.toLowerCase()));
  const filteredTranslations = translationResources.filter(resource => `${resource.language} ${resource.name} ${resource.attribution}`.toLowerCase().includes(translationSearch.toLowerCase()));
  const activeJuz = [...juzStarts].reverse().find(start => chapterNumber > start.surah || (chapterNumber === start.surah && ayahNumber >= start.ayah))?.juz || 1;
  const mappedPage = mushafPageStarts.find(start => start.surah === chapterNumber && start.ayah === ayahNumber)?.page;

  useEffect(() => {
    try { localStorage.setItem("zikr-quran-bookmarks", JSON.stringify(bookmarks)); }
    catch { setNotice("Bookmarks are available for this session, but local storage is unavailable."); }
  }, [bookmarks]);

  useEffect(() => {
    const syncBookmarks = () => {
      try { setBookmarks(JSON.parse(localStorage.getItem("zikr-quran-bookmarks") || "[]") as number[]); }
      catch { setNotice("Bookmarks could not be loaded from this browser."); }
    };
    const showAuthActionFeedback = (event: Event) => setNotice((event as CustomEvent<string>).detail || "");
    window.addEventListener("zikr-quran-bookmarks-updated", syncBookmarks);
    window.addEventListener("zikr-auth-action-feedback", showAuthActionFeedback);
    return () => {
      window.removeEventListener("zikr-quran-bookmarks-updated", syncBookmarks);
      window.removeEventListener("zikr-auth-action-feedback", showAuthActionFeedback);
    };
  }, []);

  useEffect(() => {
    const target = pendingNavigation.current;
    if (!target) return;
    const node = document.getElementById(`ayah-${target.replace(":", "-")}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    pendingNavigation.current = null;
    const timeout = window.setTimeout(() => setHighlightedAyah(0), 2200);
    return () => window.clearTimeout(timeout);
  }, [chapterNumber, ayahNumber]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const nextSurah = Math.min(surahData.length, Math.max(1, Number(params.get("surah")) || 1));
      const nextAyah = Math.min(surahData[nextSurah - 1][2], Math.max(1, Number(params.get("ayah")) || 1));
      const nextTranslation = params.get("translation");
      setSurahNumber(nextSurah);
      setAyahNumber(nextAyah);
      setSelectedTranslation(translationResources.some((resource) => resource.languageCode === nextTranslation) ? nextTranslation as TranslationLanguage : "en");
      setHighlightedAyah(nextAyah);
      pendingNavigation.current = `${nextSurah}:${nextAyah}`;
      audioRef.current?.pause();
      if (audioRef.current) { audioRef.current.removeAttribute("src"); audioRef.current.load(); }
      setActiveAudioTitle("");
      setAudioUnavailable(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!navOpen && !translationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavOpen(false); setTranslationOpen(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen, translationOpen]);

  const updateLocation = (nextSurah: number, nextAyah: number, replace = false) => {
    const params = new URLSearchParams({ surah: String(nextSurah), ayah: String(nextAyah), translation: selectedTranslation });
    navigate(`/surah-read?${params.toString()}`, { replace });
  };
  const stopAudio = () => {
    const player = audioRef.current;
    player?.pause();
    if (player) { player.removeAttribute("src"); player.load(); }
    setAudioPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setActiveAudioTitle("");
    setAudioUnavailable(false);
    pendingAudioSeek.current = null;
    lastPlaybackAyah.current = null;
  };
  const selectSurah = (nextSurah: number) => {
    const nextChapter = surahData[nextSurah - 1];
    setSurahNumber(nextSurah);
    setAyahNumber(1);
    setHighlightedAyah(1);
    pendingNavigation.current = `${nextSurah}:1`;
    stopAudio();
    setNotice("");
    setNavOpen(false);
    updateLocation(nextSurah, 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!nextChapter) setNotice("That Surah is not available in the local catalog.");
  };
  const selectVerseSurah = (nextSurah: number) => {
    const nextAyah = Math.min(ayahNumber, surahData[nextSurah - 1][2]);
    setSurahNumber(nextSurah);
    setAyahNumber(nextAyah);
    setHighlightedAyah(nextAyah);
    pendingNavigation.current = `${nextSurah}:${nextAyah}`;
    stopAudio();
    updateLocation(nextSurah, nextAyah);
  };
  const navigateToAyah = (nextSurah: number, nextAyah: number) => {
    if (!Number.isInteger(nextSurah) || !Number.isInteger(nextAyah) || nextSurah < 1 || nextSurah > surahData.length || nextAyah < 1 || nextAyah > surahData[nextSurah - 1][2]) {
      return;
    }
    setSurahNumber(nextSurah);
    setAyahNumber(nextAyah);
    setHighlightedAyah(nextAyah);
    pendingNavigation.current = `${nextSurah}:${nextAyah}`;
    setNavOpen(false);
    updateLocation(nextSurah, nextAyah);
    if (nextSurah === chapterNumber) {
      window.requestAnimationFrame(() => document.getElementById(`ayah-${nextSurah}-${nextAyah}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  };
  const toggleBookmark = (reference: number) => {
    if (!isLoggedIn) {
      onRequireAuthentication("bookmark-quran", "quran-ayah", `${chapterNumber}:${reference % 1000}`);
      return;
    }
    setBookmarks(current => current.includes(reference) ? current.filter(item => item !== reference) : [...current, reference]);
  };
  const ayahTextFor = (number: number) => {
    const content = chapterContent[number];
    const translation = content?.translations[selectedTranslation];
    return { content, translation };
  };
  const copyAyah = async (number: number) => {
    const { content, translation } = ayahTextFor(number);
    const text = [content?.arabic, translation].filter(Boolean).join("\n");
    if (!text) { setNotice("This Ayah has no text in the local mock dataset to copy."); return; }
    try { await navigator.clipboard.writeText(text); setNotice(`${chapterNumber}:${number} copied.`); }
    catch { setNotice("Clipboard access is unavailable in this browser."); }
  };
  const shareAyah = async (number: number) => {
    const { content, translation } = ayahTextFor(number);
    const text = [content?.arabic, translation, `${chapterNumber}:${number}`].filter(Boolean).join("\n");
    if (!text) { setNotice("This Ayah has no text in the local mock dataset to share."); return; }
    try {
      if (navigator.share) await navigator.share({ title: `${chapterNumber}:${number} - ${transliteratedName}`, text });
      else { await navigator.clipboard.writeText(text); setNotice("Ayah copied for sharing."); }
    } catch { setNotice("Sharing was cancelled or is unavailable."); }
  };
  const audioTimingFor = (surah: number, ayah: number) => audioSources[surah]?.timings.find(segment => segment.ayahNumber === ayah);
  const startAudio = (number?: number, targetSurah = chapterNumber) => {
    const chapterAudio = audioSources[targetSurah];
    const verseAudio = number ? ayahAudioSources[`${targetSurah}:${number}`] : undefined;
    const timing = number ? audioTimingFor(targetSurah, number) : undefined;
    const source = verseAudio?.source || chapterAudio?.source || "";
    const targetAyah = number || 1;
    setActiveAudioTitle(number ? `${surahData[targetSurah - 1][1]} · Ayah ${targetAyah}` : surahData[targetSurah - 1][1]);
    setAudioUnavailable(!source);
    setAudioProgress(0);
    setAudioDuration(0);
    setNotice("");
    lastPlaybackAyah.current = targetAyah;
    if (!source) {
      audioRef.current?.pause();
      if (audioRef.current) { audioRef.current.removeAttribute("src"); audioRef.current.load(); }
      setAudioPlaying(false);
      setNotice(number ? `Recitation audio for ${targetSurah}:${number} is not available locally.` : "Surah recitation audio is not available locally.");
      return;
    }
    setSurahNumber(targetSurah);
    setAyahNumber(targetAyah);
    setHighlightedAyah(targetAyah);
    pendingNavigation.current = `${targetSurah}:${targetAyah}`;
    updateLocation(targetSurah, targetAyah, true);
    const player = audioRef.current;
    if (!player) { setNotice("The audio player is unavailable in this browser."); return; }
    player.pause();
    player.src = source;
    player.volume = volume;
    pendingAudioSeek.current = verseAudio ? 0 : number ? timing?.startTime ?? 0 : 0;
    if (player.readyState >= 1) {
      player.currentTime = pendingAudioSeek.current;
      pendingAudioSeek.current = null;
    }
    player.load();
    void player.play().catch(() => { setAudioPlaying(false); setNotice("The configured recitation could not be played."); });
  };
  const handleAudioTimeUpdate = (player: HTMLAudioElement) => {
    setAudioProgress(player.currentTime);
    if (Number.isFinite(player.duration)) setAudioDuration(player.duration);
    const segment = audioSources[chapterNumber]?.timings.find(item => player.currentTime >= item.startTime && player.currentTime < item.endTime);
    if (!segment || segment.ayahNumber === lastPlaybackAyah.current) return;
    lastPlaybackAyah.current = segment.ayahNumber;
    setAyahNumber(segment.ayahNumber);
    setHighlightedAyah(segment.ayahNumber);
    pendingNavigation.current = `${chapterNumber}:${segment.ayahNumber}`;
    updateLocation(chapterNumber, segment.ayahNumber, true);
  };
  const audioSegments = Object.values(audioSources).flatMap(metadata => metadata.timings).sort((left, right) => left.surahNumber - right.surahNumber || left.ayahNumber - right.ayahNumber);
  const currentAudioSegmentIndex = audioSegments.findIndex(segment => segment.surahNumber === chapterNumber && segment.ayahNumber === ayahNumber);
  const moveAudioByAyah = (direction: -1 | 1) => {
    const target = audioSegments[currentAudioSegmentIndex + direction];
    if (target) startAudio(target.ayahNumber, target.surahNumber);
  };
  const seekAudio = (time: number) => {
    const player = audioRef.current;
    if (!player || !Number.isFinite(player.duration)) return;
    player.currentTime = Math.min(player.duration, Math.max(0, time));
    handleAudioTimeUpdate(player);
  };
  const selectJuz = (juz: number) => {
    const start = juzStarts.find(item => item.juz === juz);
    if (start) navigateToAyah(start.surah, start.ayah);
  };
  const selectPage = (page: number) => {
    const start = mushafPageStarts.find(item => item.page === page);
    if (start) navigateToAyah(start.surah, start.ayah);
  };

  return <main className="quran-reading-page">
    <div className="quran-reader-top">
      <button className="reader-current-surah" onClick={() => { setNavTab("Surah"); setNavOpen(true); }} aria-label={interfaceAttributeText("Open Surah navigation")}>{String(chapterNumber).padStart(2, "0")} · {transliteratedName}<span>⌄</span></button>
      <div className="reader-location">{mappedPage ? `Page ${mappedPage}` : "Page mapping unavailable"}<i /><LocalizedText text={"Juz"} trailing=" " />{activeJuz} <LocalizedText text={"/ Hizb mapping unavailable"} /></div>
      <div className="reader-modes" role="group" aria-label={interfaceAttributeText("Reader mode")}><button className={mode === "verses" ? "active" : ""} onClick={() => setMode("verses")}><LocalizedText text={"Verse by Verse"} /></button><button className={mode === "reading" ? "active" : ""} onClick={() => setMode("reading")}><LocalizedText text={"Reading"} /></button></div>
    </div>
    <div className="quran-reader-body">
      <section className="quran-reader-content">
        <div className="reader-toolbar-actions"><button className="reader-nav-open" onClick={() => { setNavTab("Surah"); setNavOpen(true); }}><Icon name="menu" size={17} /> <LocalizedText text={"Browse"} /></button><button className="reader-translation-open" onClick={() => setTranslationOpen(true)}><LocalizedText text={"Translation:"} trailing=" " />{translationResources.find(item => item.languageCode === selectedTranslation)?.language}<span>⌄</span></button></div>
        <section className="reader-chapter-card">
          <strong className="reader-chapter-arabic" lang="ar" dir="rtl">{arabicName}</strong>
          <div className="reader-chapter-copy"><span><LocalizedText text={"Surah"} trailing=" " />{chapterNumber}</span><h1>{transliteratedName} <em>{surahMeanings[chapterNumber - 1]}</em></h1><p>{revelation} • {ayahCount} <LocalizedText text={"Ayat • Local reader mock data"} /></p></div>
          <div className="reader-chapter-actions"><button onClick={() => startAudio()}><Icon name="play" size={15} /> <LocalizedText text={"Listen"} /></button><button onClick={() => setInfoOpen(open => !open)}><span aria-hidden="true">ⓘ</span> <LocalizedText text={"Info"} /></button><button className="translation-desktop" onClick={() => setTranslationOpen(true)}><LocalizedText text={"Translation:"} trailing=" " />{translationResources.find(item => item.languageCode === selectedTranslation)?.name} <span>⌄</span></button></div>
        </section>
        {infoOpen && <div className="reader-info-panel"><b><LocalizedText text={"About this Surah"} /></b><span><LocalizedText text={"Chapter"} trailing=" " />{chapterNumber} <LocalizedText text={"in canonical order"} /></span><span>{revelation} <LocalizedText text={"revelation •"} trailing=" " />{ayahCount} <LocalizedText text={"Ayat"} /></span><span><LocalizedText text={"English meaning:"} trailing=" " />{surahMeanings[chapterNumber - 1]}</span></div>}
        <div className="reader-data-note" role="note"><Icon name="book" size={16} /><p><LocalizedText text={"Ayah numbering follows chapter metadata. Local text is available only for 1:1; other slots are intentionally left without Quran text or translation."} /></p></div>
        <div className={`reader-ayah-list ${mode === "reading" ? "reading-mode" : "verse-mode"}`}>
          {Array.from({ length: ayahCount }, (_, index) => {
            const number = index + 1;
            const reference = chapterNumber * 1000 + number;
            const { content, translation } = ayahTextFor(number);
            const resource = translationResources.find(item => item.languageCode === selectedTranslation);
            const isBookmarked = bookmarks.includes(reference);
            return <article id={`ayah-${chapterNumber}-${number}`} key={`${chapterNumber}:${number}`} className={`reader-ayah ${highlightedAyah === number ? "is-highlighted" : ""} ${!content ? "content-unavailable" : ""}`}>
              <div className="reader-ayah-actions"><div><span className="ayah-reference">{chapterNumber}:{number}</span><button aria-label={`Play Ayah ${chapterNumber}:${number}`} onClick={() => startAudio(number)}>{audioPlaying && ayahNumber === number ? <span>Ⅱ</span> : <Icon name="play" size={17} />}</button><button aria-label={`${isBookmarked ? "Remove bookmark from" : "Bookmark"} Ayah ${chapterNumber}:${number}`} className={isBookmarked ? "bookmarked" : ""} onClick={() => toggleBookmark(reference)}><Icon name="heart" size={17} /></button></div><div><button aria-label={`Copy Ayah ${chapterNumber}:${number}`} onClick={() => void copyAyah(number)}><Icon name="copy" size={17} /></button><button aria-label={`Share Ayah ${chapterNumber}:${number}`} onClick={() => void shareAyah(number)}><Icon name="share" size={17} /></button></div></div>
              {content?.arabic ? <p className="reader-arabic" lang="ar" dir="rtl" translate="no">{content.arabic}</p> : <p className="ayah-unavailable"><LocalizedText text={"Quran text unavailable in the local mock data."} /></p>}
              {translation ? <p className={`reader-translation-text language-${selectedTranslation}`} lang={selectedTranslation} dir={selectedTranslation === "ur" ? "rtl" : "ltr"}>{translation}</p> : <p className="translation-unavailable">{content ? `No ${resource?.language || "selected language"} translation is available for this Ayah.` : "Translation unavailable for this Ayah in the local mock data."}</p>}
              {content && <small className="content-attribution"><LocalizedText text={"Existing prototype sample • translation attribution not recorded"} /></small>}
            </article>;
          })}
        </div>
        <nav className="reader-surah-pager" aria-label={interfaceAttributeText("Surah navigation")}><button disabled={chapterNumber === 1} onClick={() => selectSurah(chapterNumber - 1)}><LocalizedText text={"← Previous Surah"} /></button><button onClick={() => { setNavTab("Surah"); setNavOpen(true); }}><LocalizedText text={"All Surahs"} /></button><button disabled={chapterNumber === surahData.length} onClick={() => selectSurah(chapterNumber + 1)}><LocalizedText text={"Next Surah →"} /></button></nav>
      </section>
    </div>
    {notice && <div className="reader-notice" role="status"><span><LocalizedText text={notice} /></span><button aria-label={interfaceAttributeText("Dismiss message")} onClick={() => setNotice("")}><Icon name="x" size={15} /></button></div>}

    {navOpen && <div className="quran-drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setNavOpen(false); }}><aside className="quran-drawer quran-nav-drawer" role="dialog" aria-modal="true" aria-label={interfaceAttributeText("Quran navigation")}>
      <div className="drawer-heading"><div><small><LocalizedText text={"QURAN NAVIGATION"} /></small><h2>{String(chapterNumber).padStart(2, "0")} · {transliteratedName}</h2></div><button aria-label={interfaceAttributeText("Close navigation")} onClick={() => setNavOpen(false)}><Icon name="x" /></button></div>
      <div className="drawer-tabs" role="tablist" aria-label={interfaceAttributeText("Navigate by")}><button role="tab" aria-selected={navTab === "Surah"} className={navTab === "Surah" ? "active" : ""} onClick={() => setNavTab("Surah")}><LocalizedText text={"Surah"} /></button><button role="tab" aria-selected={navTab === "Verse"} className={navTab === "Verse" ? "active" : ""} onClick={() => setNavTab("Verse")}><LocalizedText text={"Verse"} /></button><button role="tab" aria-selected={navTab === "Juz"} className={navTab === "Juz" ? "active" : ""} onClick={() => setNavTab("Juz")}><LocalizedText text={"Juz"} /></button><button role="tab" aria-selected={navTab === "Page"} className={navTab === "Page" ? "active" : ""} onClick={() => setNavTab("Page")}><LocalizedText text={"Page"} /></button></div>
      {navTab === "Surah" && <><label className="drawer-search"><Icon name="search" size={17} /><input autoFocus value={surahSearch} onChange={event => setSurahSearch(event.target.value)} placeholder={interfaceAttributeText("Search Surah")} /></label><div className="surah-drawer-list">{filteredSurahs.map(({ item, number }) => <button key={number} className={chapterNumber === number ? "selected" : ""} onClick={() => selectSurah(number)}><span>{number}</span><b>{item[1]}</b><small>{surahMeanings[number - 1]}</small><strong lang="ar" dir="rtl">{item[0]}</strong></button>)}{!filteredSurahs.length && <p className="drawer-empty"><LocalizedText text={"No Surahs match that search."} /></p>}</div></>}
      {navTab === "Verse" && <div className="verse-navigation">
        <section className="verse-surah-column" aria-label={interfaceAttributeText("Select Surah")}>
          <label className="drawer-search"><Icon name="search" size={17} /><input autoFocus value={surahSearch} onChange={event => setSurahSearch(event.target.value)} placeholder={interfaceAttributeText("Search Surah")} /></label>
          <div className="verse-surah-list">{filteredSurahs.map(({ item, number }) => <button key={number} className={chapterNumber === number ? "selected" : ""} aria-current={chapterNumber === number ? "true" : undefined} onClick={() => selectVerseSurah(number)}><span>{number}</span><b>{item[1]}</b></button>)}{!filteredSurahs.length && <p className="drawer-empty"><LocalizedText text={"No Surahs match that search."} /></p>}</div>
        </section>
        <section className="verse-ayah-column" aria-label={`Ayat in ${transliteratedName}`}>
          <h3><LocalizedText text={"Ayah"} trailing=" " /><small>{chapterNumber}. {transliteratedName}</small></h3>
          <div className="verse-ayah-list">{Array.from({ length: ayahCount }, (_, index) => index + 1).map(number => <button key={`${chapterNumber}:${number}`} className={ayahNumber === number ? "selected" : ""} aria-current={ayahNumber === number ? "true" : undefined} onClick={() => navigateToAyah(chapterNumber, number)}>{number}</button>)}</div>
        </section>
      </div>}
      {navTab === "Juz" && <><p className="drawer-description"><LocalizedText text={"Select a Juz to navigate to its listed starting Ayah."} /></p><div className="juz-drawer-list">{juzStarts.map(start => <button key={start.juz} onClick={() => selectJuz(start.juz)} className={activeJuz === start.juz ? "selected" : ""}><span><LocalizedText text={"Juz"} trailing=" " />{start.juz}</span><small><LocalizedText text={"Starts at"} trailing=" " />{start.surah}:{start.ayah} · {surahData[start.surah - 1][1]}</small><Icon name="chevron" size={16} /></button>)}</div></>}
      {navTab === "Page" && <div className="page-navigation"><h3><LocalizedText text={"Madani Mushaf sample mapping"} /></h3><p><LocalizedText text={"Only two local page-start mappings are included. This is not a complete page index."} /></p>{mushafPageStarts.map(start => <button key={start.page} className={mappedPage === start.page ? "selected" : ""} onClick={() => selectPage(start.page)}><span><LocalizedText text={"Page"} trailing=" " />{start.page}</span><small><LocalizedText text={"Starts at"} trailing=" " />{start.surah}:{start.ayah} · {surahData[start.surah - 1][1]}</small><Icon name="chevron" size={16} /></button>)}</div>}
    </aside></div>}

    {translationOpen && <div className="quran-drawer-backdrop translation-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setTranslationOpen(false); }}><aside className="quran-drawer translation-drawer" role="dialog" aria-modal="true" aria-label={interfaceAttributeText("Translations")}><div className="drawer-heading"><div><small><LocalizedText text={"DISPLAY SETTINGS"} /></small><h2><LocalizedText text={"Translations"} /></h2></div><button aria-label={interfaceAttributeText("Close translations")} onClick={() => setTranslationOpen(false)}><Icon name="x" /></button></div><label className="drawer-search"><Icon name="search" size={17} /><input autoFocus value={translationSearch} onChange={event => setTranslationSearch(event.target.value)} placeholder={interfaceAttributeText("Search translations")} /></label><div className="translation-options">{[...new Set(filteredTranslations.map(resource => resource.language))].map(language => <section key={language}><h3>{language}</h3>{filteredTranslations.filter(resource => resource.language === language).map(resource => <label key={resource.id} className={`translation-option ${selectedTranslation === resource.languageCode ? "selected" : ""}`}><input type="radio" name="translation" checked={selectedTranslation === resource.languageCode} onChange={() => setSelectedTranslation(resource.languageCode)} /><span><b>{resource.name}</b><small>{resource.attribution}</small></span><span className="translation-check">{selectedTranslation === resource.languageCode ? "Selected" : ""}</span></label>)}</section>)}{!filteredTranslations.length && <p className="drawer-empty"><LocalizedText text={"No translations match that search."} /></p>}</div><button className="drawer-done" onClick={() => setTranslationOpen(false)}><LocalizedText text={"Done"} /></button></aside></div>}

    <audio
      ref={audioRef}
      preload="none"
      onPlay={() => setAudioPlaying(true)}
      onPause={() => setAudioPlaying(false)}
      onLoadedMetadata={event => {
        const player = event.currentTarget;
        setAudioDuration(Number.isFinite(player.duration) ? player.duration : 0);
        if (pendingAudioSeek.current !== null) {
          player.currentTime = pendingAudioSeek.current;
          pendingAudioSeek.current = null;
        }
      }}
      onTimeUpdate={event => handleAudioTimeUpdate(event.currentTarget)}
      onEnded={() => setAudioPlaying(false)}
      onError={() => {
        setAudioPlaying(false);
        setAudioUnavailable(true);
        setNotice("The configured recitation could not be loaded.");
      }}
    />
    {activeAudioTitle && <div className="quran-bottom-player" aria-label={interfaceAttributeText("Quran audio player")}>
      <div className="quran-player-track"><b>{activeAudioTitle}</b><small>{audioUnavailable ? "Audio unavailable · no playable source configured" : audioSources[chapterNumber]?.reciter || ayahAudioSources[`${chapterNumber}:${ayahNumber}`]?.reciter || "Quran recitation"}</small></div>
      <button aria-label={interfaceAttributeText("Previous Ayah")} title={interfaceAttributeText("Previous Ayah")} disabled={audioUnavailable || currentAudioSegmentIndex <= 0} onClick={() => moveAudioByAyah(-1)}>‹</button>
      <button aria-label={audioPlaying ? "Pause recitation" : "Play recitation"} disabled={audioUnavailable} onClick={() => {
        const player = audioRef.current;
        if (!player) return;
        if (audioPlaying) player.pause();
        else void player.play().catch(() => setNotice("The configured recitation could not be played."));
      }}>{audioPlaying ? "Ⅱ" : <Icon name="play" />}</button>
      <button aria-label={interfaceAttributeText("Next Ayah")} title={interfaceAttributeText("Next Ayah")} disabled={audioUnavailable || currentAudioSegmentIndex < 0 || currentAudioSegmentIndex >= audioSegments.length - 1} onClick={() => moveAudioByAyah(1)}>›</button>
      <input type="range" min="0" max={audioDuration} value={Math.min(audioProgress, audioDuration)} disabled={audioUnavailable || !audioDuration} onChange={event => seekAudio(Number(event.target.value))} aria-label={interfaceAttributeText("Recitation progress")} />
      <span className="quran-player-time">{`${Math.floor(audioProgress / 60)}:${String(Math.floor(audioProgress % 60)).padStart(2, "0")}`} / {audioDuration ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, "0")}` : "--:--"}</span>
      <label className="quran-player-volume" title={interfaceAttributeText("Volume")}><Icon name="volume" size={17} /><input type="range" min="0" max="1" step="0.05" value={volume} disabled={audioUnavailable} onChange={event => { const nextVolume = Number(event.target.value); setVolume(nextVolume); if (audioRef.current) audioRef.current.volume = nextVolume; }} aria-label={interfaceAttributeText("Volume")} /></label>
      <button aria-label={interfaceAttributeText("Close player")} onClick={stopAudio}>×</button>
    </div>}
  </main>;
}

function ParaPage({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const paraEntries = Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const start = juzStarts.find((entry) => entry.juz === number) || { surah: 1, ayah: 1 };
    const summary = surahData[start.surah - 1] || ["", "", 0, ""];
    return { number, label: `Para ${number}`, surahName: summary[1] || "Al-Fatihah", arabicName: summary[0] || "الفاتحة", startSurah: start.surah, startAyah: start.ayah };
  });
  const shown = filterQuranParas(paraEntries, search);
  const handleBrowseSelect = (item: (typeof quranBrowseItems)[number]) => {
    setSearch("");
    go(quranBrowseMap[item]);
  };

  return <main><DirectoryHeader go={go} title={interfaceAttributeText("Para Directory")} text="Browse the Holy Quran through its 30 traditional Juz divisions." /><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory="Para Directory" onSelectCategory={handleBrowseSelect} /><section className="section container"><div className="para-grid">{shown.map((item) => <button key={item.number} onClick={() => go(`surah-read?surah=${item.startSurah}&ayah=${item.startAyah}`)}><span>{String(item.number).padStart(2, "0")}</span><div><b>{item.label}</b><small><LocalizedText text={"Juz"} trailing=" " />{item.number} • {item.surahName}</small></div><Icon name="chevron" /></button>)}</div>{!shown.length && <div className="empty"><Icon name="search" size={32} /><h3><LocalizedText text={"No Para match that search."} /></h3><p><LocalizedText text={"Try a number, Juz name, or starting Surah reference."} /></p></div>}</section></main>;
}

function QuranTopics({ go }: { go: (r: Route) => void }) {
  const t = useInterfaceText();
  const [search, setSearch] = useState("");
  const selectedView = getRouteQueryParam("view") === "quotes" ? "Quranic Quotes" : "Topics";
  const handleBrowseSelect = (item: (typeof quranBrowseItems)[number]) => {
    setSearch("");
    go(quranBrowseMap[item]);
  };
  const topics = [
    "Patience & Perseverance",
    "Mercy & Forgiveness",
    "Gratitude",
    "Prayer & Remembrance",
    "Family & Community",
    "Knowledge & Reflection",
  ];
  const shown = topics.filter((topic) => topic.toLowerCase().includes(search.trim().toLowerCase()));

  return <main><DirectoryHeader go={go} title="Quranic Topics & Quotes" text="Explore an editorial index designed to guide thoughtful study. Published content must use verified source text and attribution." /><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory={selectedView as (typeof quranBrowseItems)[number]} onSelectCategory={handleBrowseSelect} /><section className="section container"><div className="topic-grid">{shown.map((x, i) => <button key={x}><span>0{i + 1}</span><b>{t(x)}</b><small><LocalizedText text={"Curated references"} /></small><Icon name="arrow" /></button>)}{!shown.length && <div className="empty"><Icon name="search" size={32} /><h3><LocalizedText text={"No Quran topic matches that search."} /></h3><p><LocalizedText text={"Try a different topic title or phrase."} /></p></div>}</div><div className="notice"><Icon name="book" /><div><b><LocalizedText text={"Respectful by design"} /></b><p><LocalizedText text={"Quranic quotations will only be displayed after verification against authoritative source data and translation attribution."} /></p></div></div></section></main>;
}





export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const routePath = location.pathname === "/" ? "home" : location.pathname.slice(1);
  const route = `${routePath}${location.search}`;
  const [language, setLanguage] = useState(() => {
    const saved = readPreference(GLOBAL_LANGUAGE_KEY, "en");
    return ["en", "hi", "ur"].includes(saved) ? saved : "en";
  });
  const [theme, setTheme] = useState(() => readPreference(THEME_KEY, "light") === "dark" ? "dark" : "light");
  const [fontScale, setFontScale] = useState(() => {
    const saved = Number(readPreference(FONT_SCALE_KEY, "1"));
    return Number.isFinite(saved) ? Math.max(0.9, Math.min(1.2, saved)) : 1;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => window.localStorage.getItem("zikr-authenticated") === "true");
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState(() => readPendingAction());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    document.documentElement.style.setProperty("--interface-scale", String(fontScale));
    try {
      window.localStorage.setItem(GLOBAL_LANGUAGE_KEY, language);
      window.localStorage.setItem(THEME_KEY, theme);
      window.localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
    } catch { /* Preference storage may be unavailable in private browsing. */ }
  }, [fontScale, language, theme]);

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(window.localStorage.getItem("zikr-authenticated") === "true");
    const handleSelectAudio = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id) setActiveAudioId(detail.id);
    };

    window.addEventListener("zikr-auth-state", syncAuth);
    window.addEventListener("zikr-select-audio", handleSelectAudio as EventListener);

    return () => {
      window.removeEventListener("zikr-auth-state", syncAuth);
      window.removeEventListener("zikr-select-audio", handleSelectAudio as EventListener);
    };
  }, []);

  const go = (r: Route) => {
    const [path, ...queryParts] = r.replace(/^#/, "").split("?");
    const destination = !path || path === "home" ? "/" : `/${path}`;
    const query = queryParts.length ? `?${queryParts.join("?")}` : "";
    navigate(`${destination}${query}`);
  };

  const previousRoutePath = useRef(routePath);
  useEffect(() => {
    if (!lyricsRoutePaths.includes(previousRoutePath.current) || !lyricsRoutePaths.includes(routePath)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    previousRoutePath.current = routePath;
  }, [routePath]);

  const activeAudio = useMemo(() => (activeAudioId ? getAudioById(activeAudioId) : null), [activeAudioId]);

  const requireAuthentication = (action: string, contentType: string, contentId: string) => {
    if (isLoggedIn) return true;
    const returnRoute = `${location.pathname.replace(/^\//, "")}${location.search}`;
    const intent = createPendingAction({ action, contentType, contentId, returnTo: returnRoute ? `#${returnRoute}` : "#home" });
    if (!intent || !savePendingAction(intent)) {
      window.alert(translateInterface(language, "This action could not be saved for return after sign-in. Please retry from the content page."));
      return false;
    }
    setPendingAction(intent);
    go("login");
    return false;
  };

  const dismissPendingAction = () => {
    clearPendingAction();
    setPendingAction(null);
  };

  const resumePendingAction = () => {
    const intent = readPendingAction();
    if (!intent) {
      setPendingAction(null);
      return;
    }
    if (!isLoggedIn) {
      go("login");
      return;
    }

    if (intent.action === "download-audio") {
      const track = getAudioById(intent.contentId);
      if (!track?.downloadable || track.isDemo || !isAvailableDownloadUrl(track.downloadUrl)) {
        clearPendingAction();
        setPendingAction(null);
        window.alert(translateInterface(language, "This audio download is no longer available."));
        return;
      }
      clearPendingAction();
      setPendingAction(null);
      handleDownloadAudio(track);
      return;
    }

    if (intent.action === "download-book") {
      const book = getEbookById(intent.contentId);
      if (!book?.downloadable || !isAvailableDownloadUrl(book.downloadUrl)) {
        clearPendingAction();
        setPendingAction(null);
        window.alert(translateInterface(language, "This PDF is no longer available or authorized for download."));
        return;
      }
      clearPendingAction();
      setPendingAction(null);
      handleDownloadBook(book);
      return;
    }

    if (intent.action === "bookmark-quran") {
      const [surahValue, ayahValue] = intent.contentId.split(":");
      const surahNumber = Number(surahValue);
      const ayahNumber = Number(ayahValue);
      const chapter = surahData[surahNumber - 1];
      if (!chapter || ayahNumber < 1 || ayahNumber > chapter[2]) {
        clearPendingAction();
        setPendingAction(null);
        window.alert(translateInterface(language, "This Quran bookmark reference is unavailable."));
        return;
      }
      try {
        const key = "zikr-quran-bookmarks";
        const bookmarks = JSON.parse(window.localStorage.getItem(key) || "[]");
        const reference = surahNumber * 1000 + ayahNumber;
        const nextBookmarks = bookmarks.includes(reference) ? bookmarks.filter((item) => item !== reference) : [...bookmarks, reference];
        window.localStorage.setItem(key, JSON.stringify(nextBookmarks));
        window.dispatchEvent(new Event("zikr-quran-bookmarks-updated"));
        window.dispatchEvent(new CustomEvent("zikr-auth-action-feedback", { detail: "Bookmark updated in this browser. Account sync is unavailable in this prototype." }));
        clearPendingAction();
        setPendingAction(null);
      } catch {
        window.alert(translateInterface(language, "Bookmarks could not be saved in this browser."));
      }
      return;
    }

    window.alert(translateInterface(language, "Account saving is unavailable because this project has no saved-items service."));
  };

  const handlePlayAudio = (track: (typeof audioLibrary)[number]) => {
    if (!track || !track.source) return;
    setActiveAudioId(track.id);
  };

  const handleDownloadAudio = (track: (typeof audioLibrary)[number]) => {
    if (!track || !requireAuthentication("download-audio", "audio", track.id)) return;
    if (!track.downloadable || track.isDemo || !isAvailableDownloadUrl(track.downloadUrl)) {
      window.alert(translateInterface(language, "This audio file is not available for download."));
      return;
    }
    const opened = window.open(track.downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.alert(translateInterface(language, "The browser blocked the download window. Allow pop-ups and retry."));
  };

  const handleDownloadBook = (book: (typeof ebookLibrary)[number]) => {
    if (!book || !requireAuthentication("download-book", "book", book.id)) return;
    if (!book.downloadable || !isAvailableDownloadUrl(book.downloadUrl)) {
      window.alert(translateInterface(language, "This PDF is unavailable or not authorized for download."));
      return;
    }
    const opened = window.open(book.downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.alert(translateInterface(language, "The browser blocked the download window. Allow pop-ups and retry."));
  };

  const headerRoute = lyricsRoutePaths.includes(routePath) ? "lyrics" : routePath;
  return <InterfaceLanguageContext.Provider value={language}><div className="app-shell" data-theme={theme}>
    {isLoggedIn && pendingAction && !["login", "register"].includes(routePath) && <PendingActionNotice pendingAction={pendingAction} action={pendingAction.action} onContinue={resumePendingAction} onDismiss={dismissPendingAction} />}
    <Routes>
      <RouterRoute element={<PublicLayout route={headerRoute} go={go} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} fontScale={fontScale} setFontScale={setFontScale} />}>
        <RouterRoute index element={<Home go={go} onPlayAudio={handlePlayAudio} onDownloadAudio={handleDownloadAudio} activeAudioId={activeAudioId} />} />
        <RouterRoute path="home" element={<Navigate to="/" replace />} />
        <RouterRoute path="lyrics" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyrics-category" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyrics-artists" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyrics-poets" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyrics-books" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyrics-languages" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyrics-subjects" element={<LyricsPage go={go} route={route} />} />
        <RouterRoute path="lyric-detail" element={<><LyricDetail go={go} /><LyricWordEnhancer language={language} /></>} />
        <RouterRoute path="quran" element={<QuranHome go={go} />} />
        <RouterRoute path="surahs" element={<SurahDirectory go={go} />} />
        <RouterRoute path="surah-read" element={<SurahRead go={go} isLoggedIn={isLoggedIn} onRequireAuthentication={requireAuthentication} />} />
        <RouterRoute path="para" element={<ParaPage go={go} />} />
        <RouterRoute path="quran-topics" element={<QuranTopics go={go} />} />
        <RouterRoute path="audio" element={<AudioPage go={go} onPlayAudio={handlePlayAudio} onDownloadAudio={handleDownloadAudio} activeAudioId={activeAudioId} />} />
        <RouterRoute path="audio-detail" element={<AudioDetail go={go} onPlayAudio={handlePlayAudio} onDownloadAudio={handleDownloadAudio} activeAudioId={activeAudioId} />} />
        <RouterRoute path="services" element={<ServicesPage go={go} />} />
        <RouterRoute path="ebooks" element={<Ebooks go={go} onDownloadBook={handleDownloadBook} />} />
        <RouterRoute path="book-detail" element={<BookDetail go={go} isLoggedIn={isLoggedIn} onDownloadBook={handleDownloadBook} />} />
        <RouterRoute path="about" element={<AboutPage go={go} />} />
        <RouterRoute path="contact" element={<ContactPage go={go} />} />
        <RouterRoute path="*" element={<NotFound go={go} />} />
      </RouterRoute>
      <RouterRoute element={<BareLayout />}>
        <RouterRoute path="login" element={<AuthPage mode="login" go={go} />} />
        <RouterRoute path="register" element={<AuthPage mode="register" go={go} />} />
        <RouterRoute path="admin" element={<AdminPage go={go} />} />
        <RouterRoute path="admin-edit" element={<AdminPage edit go={go} />} />
        <RouterRoute path="book-reader" element={<BookReader go={go} />} />
      </RouterRoute>
    </Routes>
    {activeAudio && <PersistentAudioPlayer track={activeAudio} onClose={() => setActiveAudioId(null)} />}
  </div></InterfaceLanguageContext.Provider>;
}
