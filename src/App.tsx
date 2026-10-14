import { useEffect, useMemo, useRef, useState } from "react";
import { audioCategories, audioLibrary, filterAudioLibrary, getAudioById } from "./audioData";
import { ebookCategories, ebookLibrary, filterEbooks, getEbookById } from "./bookData";
import { clearPendingAction, createPendingAction, readPendingAction, savePendingAction, safeReturnTo } from "./authActions.js";
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
type IconName =
  | "search" | "menu" | "x" | "arrow" | "book" | "play" | "headphones"
  | "pen" | "layers" | "download" | "copy" | "share" | "user" | "mail"
  | "grid" | "volume" | "chevron" | "heart" | "eye" | "check";

const photos = {
  hero: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=2000&q=86",
  mosque: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=82",
  minaret: "https://images.unsplash.com/photo-1567712595315-545da0d341b2?auto=format&fit=crop&w=1200&q=82",
};
const heroVideo = "/videos/zikr-e-ilahi-hero.mp4";

const books = [
  { title: "Gardens of Devotion", author: "Editorial Collection", category: "Naat Books", date: "10 May 2025", downloadable: false, color: "emerald" },
  { title: "Pathways of Remembrance", author: "Editorial Collection", category: "Islamic Books", date: "01 May 2025", downloadable: true, color: "wine" },
  { title: "Durood & Salam", author: "Compiled Edition", category: "Durood-o-Salam", date: "24 Apr 2025", downloadable: false, color: "navy" },
  { title: "Prayers for Every Day", author: "Editorial Collection", category: "Dua Books", date: "16 Apr 2025", downloadable: true, color: "sand" },
];

const lyricsBrowseItems = [
  ["All Lyrics", "lyrics"],
  ["Categories", "lyrics-category"],
  ["Naat-Khwaan / Reciters", "lyrics-artists"],
  ["Poets", "lyrics-poets"],
  ["Books", "lyrics-books"],
  ["Language", "lyrics-languages"],
  ["Subject / Occasion", "lyrics-subjects"],
] as const;
const lyricsRoutePaths = ["lyrics", "lyrics-category", "lyrics-artists", "lyrics-poets", "lyrics-books", "lyrics-languages", "lyrics-subjects"];

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

function getRouteQueryParam(name) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  return params.get(name) || "";
}

function isAvailableDownloadUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "www.w3.org" && url.pathname.endsWith("/tests/xhtml/testfiles/resources/pdf/dummy.pdf")) return false;
    if (url.hostname === "www.soundhelix.com") return false;
    return true;
  }
  catch { return false; }
}

function getTitleFirstLetter(title) {
  const match = (title || "").match(/[A-Za-z0-9]/);
  if (!match) return "";
  const first = match[0];
  return /\d/.test(first) ? "0-9" : first.toUpperCase();
}

function getLyricCategoryNames(item) {
  return (item.categoryIds || []).map((categoryId) => lyricCategories.find((category) => category.id === categoryId)?.name || categoryId).filter(Boolean);
}

function getLyricArtistName(item) {
  return artists.find((artist) => artist.id === item.artistId)?.name || item.artist || "Unknown artist";
}

function getLyricWriterName(item) {
  return poets.find((poet) => poet.id === item.writerId)?.name || item.writer || "Unknown writer";
}

function getLyricBookName(item) {
  return item.bookId ? lyricBooks.find((book) => book.id === item.bookId)?.title || "" : "";
}

function formatLyricDate(date) {
  if (!date) return "Recently published";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getPrimaryLanguage(item) {
  const preferred = item.languageVersions?.[0];
  return preferred ? preferred.label : "Urdu";
}

function getLetterOptions() {
  return ["All", "0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
}

function matchesLyricsLetter(value: string, letter: string) {
  if (letter === "All") return true;
  const firstMeaningful = (value || "").match(/[A-Za-z0-9]/)?.[0] || "";
  if (!firstMeaningful) return false;
  return letter === "0-9" ? /\d/.test(firstMeaningful) : firstMeaningful.toUpperCase() === letter;
}

function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("is-revealed");
      return;
    }
    try {
      element.classList.add("reveal-pending");
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          element.classList.remove("reveal-pending");
          element.classList.add("is-revealed");
          observer.unobserve(element);
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -36px" });
      observer.observe(element);
      return () => observer.disconnect();
    } catch {
      element.classList.remove("reveal-pending");
      element.classList.add("is-revealed");
    }
  }, [delay]);
  return ref;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal<HTMLDivElement>(delay);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    x: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" /></>,
    play: <path d="m9 7 8 5-8 5z" />,
    headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1z" /></>,
    pen: <><path d="m4 20 4-1 10-10-3-3L5 16zM13.5 7.5l3 3" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M5 20h14" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
    volume: <><path d="M5 10v4h4l5 4V6l-5 4z" /><path d="M17 9a4 4 0 0 1 0 6" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    heart: <path d="M20.8 5.7a5.4 5.4 0 0 0-7.6 0L12 6.9l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 22l8.8-8.7a5.4 5.4 0 0 0 0-7.6z" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo"><span className="logo-mark"><span>ذ</span></span>{!compact && <span><b>ZIKR-E-ILAHI</b><small>REMEMBER • REFLECT • RISE</small></span>}</div>;
}

function Btn({ children, onClick, variant = "primary", icon, type = "button", disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: string; icon?: IconName; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{children}{icon && <Icon name={icon} size={17} />}</button>;
}

function Header({ route, go }: { route: Route; go: (r: Route) => void }) {
  const [open, setOpen] = useState(false);
  const nav = [["Home", "home"], ["Lyrics", "lyrics"], ["Quran", "quran"], ["Audio", "audio"], ["Services", "services"], ["E-Books", "ebooks"], ["About Us", "about"], ["Contact Us", "contact"]];
  return <>
    {/* <div className="announcement">A peaceful space for remembrance, learning, and reflection <span>Explore our latest devotional collection</span></div>
     */}
    <header className="header">
      <button className="brand-button" onClick={() => go("home")} aria-label="Zikr-e-Ilahi home"><Logo /></button>
      <nav className="desktop-nav" aria-label="Main navigation">
        {nav.map(([label, key]) => <button key={key} onClick={() => go(key)} className={route === key ? "active" : ""}>{label}</button>)}
      </nav>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Search" onClick={() => go("lyrics")}><Icon name="search" /></button>
        <button className="login-link" onClick={() => go("login")}><Icon name="user" size={16} /> Register / Login</button>
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Icon name={open ? "x" : "menu"} /></button>
      </div>
      {open && <nav className="mobile-nav">{nav.map(([label, key]) => <button key={key} onClick={() => { go(key); setOpen(false); }}>{label}</button>)}<button onClick={() => { go("login"); setOpen(false); }}>Register / Login</button></nav>}
    </header>
  </>;
}

function SectionHead({ eyebrow, title, body, action, onAction }: { eyebrow?: string; title: string; body?: string; action?: string; onAction?: () => void }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className="section-head reveal"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{body && <p>{body}</p>}</div>{action && <button className="text-link" onClick={onAction}>{action}<Icon name="arrow" size={17} /></button>}</div>;
}

function Breadcrumbs({ items, go }: { items: string[]; go: (r: Route) => void }) {
  return <div className="breadcrumbs"><button onClick={() => go("home")}>Home</button>{items.map((x, i) => <span key={x}><Icon name="chevron" size={13} /><b>{x}</b>{i < items.length - 1 ? "" : ""}</span>)}</div>;
}

function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: React.ReactNode }) {
  return <section className="page-hero"><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p>{children}</div></section>;
}

function Tabs({ items, active, setActive }: { items: string[]; active: string; setActive: (v: string) => void }) {
  return <div className="tabs">{items.map(item => <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>{item}</button>)}</div>;
}

function SearchBox({ value, setValue, placeholder = "Search by title, artist, writer..." }: { value: string; setValue: (v: string) => void; placeholder?: string }) {
  return <label className="search-box"><Icon name="search" /><input value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button onClick={() => setValue("")} aria-label="Clear search"><Icon name="x" size={16} /></button>}</label>;
}

function PendingActionNotice({ pendingAction, action, onContinue, onDismiss }: { pendingAction: any; action: string; onContinue: () => void; onDismiss: () => void }) {
  if (pendingAction?.action !== action) return null;
  return <div className="auth-pending-notice" role="status"><span>Sign-in complete. Continue your pending action?</span><div><button type="button" onClick={onContinue}>Continue</button><button type="button" onClick={onDismiss}>Cancel</button></div></div>;
}

function LyricsBrowseControl({ go, active = "lyrics" }: { go: (r: Route) => void; active?: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return <div className="lyrics-browse-wrap" ref={menuRef}>
    <button type="button" className="lyrics-browse-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      Browse <Icon name="chevron" size={14} />
    </button>
    {open && <div className="lyrics-browse-menu" role="menu" aria-label="Lyrics browse destinations">
      {lyricsBrowseItems.map(([label, route]) => <button key={route} type="button" role="menuitem" className={active === route ? "active" : ""} onClick={() => { go(route); setOpen(false); }}>{label}</button>)}
    </div>}
  </div>;
}

function CategoryBrowseControl({ items, value, onChange, label = "Browse" }: { items: string[]; value: string; onChange: (value: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return <div className="lyrics-browse-wrap" ref={menuRef}>
    <button type="button" className="lyrics-browse-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`${label} categories`} onClick={() => setOpen((current) => !current)}>
      {label} <Icon name="chevron" size={14} />
    </button>
    {open && <div className="lyrics-browse-menu" role="menu" aria-label={`${label} categories`}>
      {items.map((item) => <button key={item} type="button" role="menuitemradio" aria-checked={value === item} className={value === item ? "active" : ""} onClick={() => { onChange(item); setOpen(false); }}>{item}</button>)}
    </div>}
  </div>;
}

function Home({ go, onPlayAudio, onDownloadAudio, activeAudioId }: { go: (r: Route) => void; onPlayAudio: (track: (typeof audioLibrary)[number]) => void; onDownloadAudio: (track: (typeof audioLibrary)[number]) => void; activeAudioId: string | null }) {
  const heroRef = useReveal<HTMLDivElement>();
  const servicePreviewRef = useRef<HTMLElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(motionPreference.matches);
    motionPreference.addEventListener("change", updateMotionPreference);
    return () => motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);
  useEffect(() => {
    const section = servicePreviewRef.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) return;

    section.classList.add("services-reveal-ready");
    try {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("services-revealed");
          observer.unobserve(section);
        }
      }, { threshold: 0.2 });
      observer.observe(section);
      return () => observer.disconnect();
    } catch {
      section.classList.add("services-revealed");
    }
  }, []);
  const features = [
    ["pen", "Lyrics", "Naats, Hamd, Manqabat & Sufi Kalam", "lyrics"],
    ["book", "The Holy Quran", "Read Surahs with trusted translations", "quran"],
    ["headphones", "Devotional Audio", "Listen, reflect, and find peace", "audio"],
    ["layers", "E-Books", "A thoughtful Islamic digital library", "ebooks"],
    ["grid", "Creative Services", "Production for devotional creators", "services"],
  ] as const;
  return <main>
    <section className="hero" style={{ backgroundImage: `url(${photos.hero})` }}>
      {!prefersReducedMotion && <video className="hero-background-video" autoPlay muted loop playsInline preload="metadata" poster={photos.hero} aria-hidden="true" tabIndex={-1}><source src={heroVideo} type="video/mp4" /></video>}
      <div className="hero-pattern" /><div ref={heroRef} className="container hero-content reveal"><span className="eyebrow">A SANCTUARY FOR THE HEART</span><h1>Find Peace in<br /><em>Remembrance</em> of Allah</h1><p>Explore beautiful Naats, Quranic verses, devotional audio, and Islamic literature in one peaceful place.</p><div className="button-row"><Btn onClick={() => go("lyrics")} icon="arrow">Explore Devotional Content</Btn><Btn onClick={() => go("quran")} variant="ghost">Read the Quran</Btn></div><div className="hero-note"><span>ٱذْكُرُوا ٱللَّهَ</span><i />Remember Allah often</div></div>
    </section>
    <section className="quick container"><div className="feature-grid">{features.map(([icon, title, text, path], i) => <Reveal className="card-reveal" delay={i * 80} key={title}><button className="feature-card" onClick={() => go(path)}><span className="feature-icon"><Icon name={icon} /></span><span><b>{title}</b><small>{text}</small></span><Icon name="arrow" size={18} /></button></Reveal>)}</div></section>
    <section className="section container"><SectionHead eyebrow="Newly Added" title="Latest Lyrics" body="Words of devotion, carefully presented for reflection and recitation." action="View All Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{getPublishedLyrics(lyricLibrary).slice(0, 4).map((x, i) => <LyricsCard item={x} key={x.id} index={i} onClick={() => go(`lyric-detail?id=${x.id}`)} />)}</div></section>
    <section className="quran-feature"><Reveal className="container quran-feature-inner"><div className="calligraphy"><span>القرآن</span><small>THE HOLY QURAN</small></div><div><span className="eyebrow">READ • REFLECT • UNDERSTAND</span><h2>Reconnect Through<br />the Holy Quran</h2><p>Browse all Surahs and Paras with a serene reading experience and carefully presented translations.</p><div className="mini-links">{["Surah", "Para", "Quranic Topics", "Quranic Quotes"].map(x => <button onClick={() => go(x === "Para" ? "para" : x === "Surah" ? "surahs" : "quran-topics")} key={x}>{x}<Icon name="chevron" size={14} /></button>)}</div><Btn onClick={() => go("quran")} icon="arrow">Explore Quran</Btn></div></Reveal></section>
    <section className="section dark-section"><div className="container"><SectionHead eyebrow="Listen & Reflect" title="Latest Devotional Audio" body="Soulful recitations and timeless words of devotion." action="View All Audio" onAction={() => go("audio")} /><div className="audio-grid">{filterAudioLibrary(audioLibrary, { category: "All Audio" }).slice(0, 3).map((x, i) => <AudioCard key={x.id} item={x} index={i} onClick={() => go(`audio-detail?id=${x.id}`)} onPlay={onPlayAudio} onDownload={onDownloadAudio} activeAudioId={activeAudioId || ""} />)}</div></div></section>
    <section className="section container"><SectionHead eyebrow="Knowledge for the Soul" title="Featured E-Books" body="Discover a curated library of Islamic literature." action="Explore E-Books" onAction={() => go("ebooks")} /><div className="book-grid">{books.map((x, i) => <BookCard item={x} key={x.title} index={i} onClick={() => go("book-detail")} />)}</div></section>
    <section ref={servicePreviewRef} className="service-preview"><div className="container service-preview-grid"><div className="service-intro"><span className="eyebrow">Creative Studio</span><h2>Devotional content,<br /><em>beautifully crafted.</em></h2><p>From pristine audio to thoughtful visuals, we help creators share their message with clarity and care.</p><Btn onClick={() => go("services")} icon="arrow">View Our Services</Btn></div><div className="service-list">{["Naat Mixing & Mastering", "Video Editing", "Thumbnails & Posters", "Audio Distribution", "YouTube Management"].map((x, i) => <button className="service-row" key={x} onClick={() => go("services")}><span>0{i + 1}</span><b>{x}</b><Icon name="arrow" /></button>)}</div></div></section>
    <section className="closing"><div className="ornament">✦</div><span className="eyebrow">BEGIN YOUR JOURNEY</span><h2>Let every word bring<br />your heart closer.</h2><p>Explore a peaceful collection made for remembrance and reflection.</p><Btn onClick={() => go("lyrics")} icon="arrow">Discover Zikr-e-Ilahi</Btn></section>
  </main>;
}

function LyricsCard({ item, index, onClick }: { item: (typeof lyricLibrary)[number]; index: number; onClick: () => void }) {
  const ref = useReveal<HTMLElement>((index % 4) * 85);
  const artistName = getLyricArtistName(item);
  const writerName = getLyricWriterName(item);
  const categoryLabel = getLyricCategoryNames(item).join(" • ") || "Devotional";
  const languageLabel = getPrimaryLanguage(item);
  const itemDate = formatLyricDate(item.createdAt);

  return <article ref={ref} className="lyric-card editorial-lyric reveal" onClick={onClick} tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}><img src={item.image} alt="" loading="lazy" /><span className="lyric-overlay" /><div className="lyric-content"><div className="lyric-top"><span className="editorial-label">{categoryLabel} • {languageLabel}</span><span>{itemDate}</span></div><div className="lyric-bottom"><h3>{item.title}</h3><p>Recited by <b>{artistName}</b></p><small>Written by {writerName}</small><button className="editorial-action" aria-label={`Read ${item.title}`}>Read Lyrics <Icon name="arrow" /></button></div></div></article>;
}

function formatAudioTime(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getAudioCategoryLabel(item) {
  return Array.isArray(item.categories) && item.categories.length ? item.categories.join(" • ") : item.category || "Devotional";
}

function AudioCard({ item, index, onClick, onPlay, onDownload, activeAudioId = "" }: { item: (typeof audioLibrary)[number]; index: number; onClick: () => void; onPlay: (track: (typeof audioLibrary)[number]) => void; onDownload: (track: (typeof audioLibrary)[number]) => void; activeAudioId?: string }) {
  const ref = useReveal<HTMLElement>((index % 4) * 85);
  const isActive = activeAudioId === item.id;
  const canDownload = item.downloadable && !item.isDemo && isAvailableDownloadUrl(item.downloadUrl);

  return <article ref={ref} className="audio-card reveal"><div className={`audio-art ${item.color}`}><img src={item.image} alt="" loading="lazy" /><span className="media-overlay" /><div className="arch-art"><span>ذِكْر</span></div><button className="play-btn" onClick={(event) => { event.stopPropagation(); onPlay(item); }} aria-label={isActive ? "Pause selected audio" : `Play ${item.title}`}>{isActive ? <span className="pause">Ⅱ</span> : <Icon name="play" />}</button></div><div className="audio-info"><span className="badge">{getAudioCategoryLabel(item)}</span>{item.featured ? <span className="featured-chip">Featured</span> : null}<h3><button className="card-title-link" onClick={onClick}>{item.title}</button></h3><p>{item.artist}</p><div className="media-meta"><span>{new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span><span>{item.duration}</span></div><div className="audio-card-actions"><button className="audio-inline-action" onClick={(event) => { event.stopPropagation(); onPlay(item); }}>{isActive ? "Playing" : "Play"}</button>{item.downloadable && <button className="audio-inline-action secondary" disabled={!canDownload} onClick={(event) => { event.stopPropagation(); onDownload(item); }}>{canDownload ? "Download" : "Download unavailable"}</button>}</div></div></article>;
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

  return <div className="shared-audio-player" role="region" aria-label="Persistent audio player"><audio ref={audioRef} preload="metadata" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onEnded={() => setIsPlaying(false)} onError={() => { setError("The selected audio source is unavailable or blocked."); setIsPlaying(false); }} /><div className="shared-player-meta"><b>{track.title}</b><small>{track.artist}</small></div><div className="shared-player-controls"><button aria-label="Previous track" disabled={!previousTrack} onClick={() => window.dispatchEvent(new CustomEvent("zikr-select-audio", { detail: { id: previousTrack?.id } }))}>{"‹"}</button><button aria-label={isPlaying ? "Pause audio" : "Play audio"} className="main" onClick={() => void togglePlayback()}>{isPlaying ? "Ⅱ" : <Icon name="play" size={18} />}</button><button aria-label="Next track" disabled={!nextTrack} onClick={() => window.dispatchEvent(new CustomEvent("zikr-select-audio", { detail: { id: nextTrack?.id } }))}>{"›"}</button><input aria-label="Audio progress" type="range" min="0" max={duration || 100} value={Math.min(currentTime, duration || 100)} onChange={(event) => { const player = audioRef.current; if (!player) return; player.currentTime = Number(event.target.value); setCurrentTime(Number(event.target.value)); }} /><span>{formatAudioTime(currentTime)}</span><span className="divisor">/</span><span>{duration ? formatAudioTime(duration) : "0:00"}</span></div><div className="shared-player-speed"><button aria-label="Close player" className="close-player" onClick={onClose}>×</button>{speeds.map((speed) => <button key={speed} type="button" className={playbackRate === speed ? "active" : ""} onClick={() => setPlaybackRate(speed)} aria-label={`Set playback speed to ${speed} times`}>{speed}×</button>)}</div>{error && <div className="player-error">{error}</div>}</div>;
}

function BookCard({ item, index, onClick, onDownload }: { item: any; index: number; onClick: () => void; onDownload?: (book: any) => void }) {
  const ref = useReveal<HTMLElement>((index % 4) * 85);
  const canDownload = item.downloadable && isAvailableDownloadUrl(item.downloadUrl) && Boolean(onDownload);
  return <article ref={ref} className="book-card reveal"><button className={`book-cover ${item.color}`} onClick={onClick}><span className="cover-ornament">۞</span><small>ZIKR-E-ILAHI LIBRARY</small><b>{item.title}</b><i>Volume {index + 1}</i></button><span className="badge">{item.category}</span><h3>{item.title}</h3><p>{item.author} <span aria-hidden="true">•</span> {item.date}</p><div className="book-actions"><Btn variant="outline" icon="book" onClick={onClick}>Read Online</Btn><Btn variant="outline" icon="download" disabled={!canDownload} onClick={() => canDownload && onDownload?.(item)}>{canDownload ? "Download PDF" : "Download unavailable"}</Btn></div></article>;
}

function DirectoryHeader({ go, title, text }: { go: (r: Route) => void; title: string; text: string }) {
  return <><div className="cream-top"><div className="container"><Breadcrumbs items={[title]} go={go} /><span className="eyebrow">ZIKR-E-ILAHI LIBRARY</span><h1>{title}</h1><p>{text}</p></div></div></>;
}

function LyricsSubNav({ go, active }: { go: (r: Route) => void; active: string }) {
  const items = [
    ["All Lyrics", "lyrics"],
    ["Categories", "lyrics-category"],
    ["Naat-Khwaan", "lyrics-artists"],
    ["Poets", "lyrics-poets"],
    ["Books", "lyrics-books"],
    ["Language", "lyrics-languages"],
    ["Subject / Occasion", "lyrics-subjects"],
  ] as const;

  return <div className="lyrics-subnav"><div className="container"><nav aria-label="Lyrics browsing navigation">{items.map(([label, route]) => <button key={route} className={active === route ? "active" : ""} onClick={() => go(route)}>{label}</button>)}</nav></div></div>;
}

function renderLyricCards(items, go, onClickRoute = "lyric-detail") {
  return <div className="lyrics-list">{items.map((item, index) => <LyricsCard item={item} index={index} key={item.id} onClick={() => go(`${onClickRoute}?id=${item.id}`)} />)}</div>;
}

function LyricsPage({ go, route }: { go: (r: Route) => void; route: string }) {
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState("All");
  const activeRoute = route.split("?")[0];
  const published = getPublishedLyrics(lyricLibrary);
  const query = search.trim().toLowerCase();
  type LyricsBrowseEntry = { id: string; name: string; lyrics: any[] };
  type LyricsBrowseConfig = { title: string; heading: string; parameter: string; noun: string; entries: LyricsBrowseEntry[] };
  const optionConfig: Record<string, LyricsBrowseConfig> = {
    "lyrics-category": {
      title: "Categories",
      heading: "Browse by Category",
      parameter: "category",
      noun: "categories",
      entries: lyricCategories.map((entry: any) => ({ id: entry.id, name: entry.name, lyrics: getLyricsByCategory(published, entry.id) })),
    },
    "lyrics-artists": {
      title: "Naat-Khwaan / Reciters",
      heading: "Browse by Reciter",
      parameter: "artist",
      noun: "reciters",
      entries: artists.map((entry: any) => ({ id: entry.id, name: entry.name, lyrics: getLyricsByArtist(published, entry.id) })),
    },
    "lyrics-poets": {
      title: "Poets",
      heading: "Browse by Poet",
      parameter: "poet",
      noun: "poets",
      entries: poets.map((entry: any) => ({ id: entry.id, name: entry.name, lyrics: getLyricsByPoet(published, entry.id) })),
    },
    "lyrics-books": {
      title: "Books",
      heading: "Browse by Source",
      parameter: "book",
      noun: "books",
      entries: lyricBooks.map((entry: any) => ({ id: entry.id, name: entry.title, lyrics: getLyricsByBook(published, entry.id) })),
    },
    "lyrics-languages": {
      title: "Language",
      heading: "Browse by Language",
      parameter: "language",
      noun: "languages",
      entries: Array.from(new Map<string, string>(published.flatMap((lyric: any) => lyric.languageVersions || []).map((version: any) => [version.code, version.label] as [string, string])).entries()).map(([id, name]) => ({ id, name, lyrics: getLyricsByLanguage(published, id) })),
    },
    "lyrics-subjects": {
      title: "Subject / Occasion",
      heading: "Browse by Subject or Occasion",
      parameter: "subject",
      noun: "subjects",
      entries: lyricSubjects.map((entry: any) => ({ id: entry.id, name: entry.name, lyrics: getLyricsBySubject(published, entry.id) })),
    },
  };
  const config = optionConfig[activeRoute];
  const selectedId = config ? getRouteQueryParam(config.parameter) : "";
  const selected = config?.entries.find((entry: LyricsBrowseEntry) => entry.id === selectedId);
  const overview = activeRoute !== "lyrics" && (!config || !selected);

  useEffect(() => {
    setSearch("");
    setLetter("All");
  }, [activeRoute, selectedId]);

  const placeholder = activeRoute === "lyrics" ? "Search lyric titles"
    : selected ? `Search ${selected.name} lyrics`
      : config ? `Search ${config.title.toLowerCase()} and lyrics`
        : "Search lyric titles";
  const matchesSearchAndLetter = (item: any) => {
    const entityName = selected?.name.toLowerCase() || "";
    return (!query || item.title.toLowerCase().includes(query) || entityName.includes(query)) && matchesLyricsLetter(item.title, letter);
  };
  const selectedLyrics = selected ? selected.lyrics.filter(matchesSearchAndLetter) : [];
  const directoryEntries = config?.entries.filter((entry: LyricsBrowseEntry) =>
    matchesLyricsLetter(entry.name, letter) && (!query || entry.name.toLowerCase().includes(query) || entry.lyrics.some((item: any) => item.title.toLowerCase().includes(query)))
  ) || [];
  const allLyrics = filterLyricsByTitle(published, search, letter);
  const handleSearch = (value: string) => setSearch(value);
  const handleCategoryChange = (nextRoute: string) => {
    setSearch("");
    setLetter("All");
    go(nextRoute);
  };
  const returnToOverview = () => {
    setSearch("");
    setLetter("All");
    go(activeRoute);
  };
  const clearFilters = () => { setSearch(""); setLetter("All"); };
  const resultLyrics = activeRoute === "lyrics" ? allLyrics : selectedLyrics;
  const resultTitle = activeRoute === "lyrics" ? "Recently Published" : selected ? `${selected.name} lyrics` : "Matching Lyrics";
  const resultEyebrow = `${resultLyrics.length} ${resultLyrics.length === 1 ? "work" : "works"}`;
  const emptyMessage = activeRoute === "lyrics" ? "No lyrics match those filters." : `No lyrics match this ${config?.title.toLowerCase() || "category"} selection.`;

  return <main><DirectoryHeader go={go} title="Devotional Lyrics" text="Discover words of praise and devotion across languages, traditions, and beloved voices." /><div className="container directory-controls"><div className="lyrics-search-row"><SearchBox value={search} setValue={handleSearch} placeholder={placeholder} /><LyricsBrowseControl go={handleCategoryChange} active={activeRoute} /></div><div className="alphabet" aria-label="Filter by first letter"><button className={letter === "All" ? "active" : ""} onClick={() => setLetter("All")}>All</button>{getLetterOptions().slice(1).map((option) => <button key={option} className={letter === option ? "active" : ""} onClick={() => setLetter(option)}>{option === "0-9" ? "0–9" : option}</button>)}</div></div>{activeRoute === "lyrics" ? <section className="section container"><SectionHead eyebrow={resultEyebrow} title={resultTitle} />{resultLyrics.length ? renderLyricCards(resultLyrics, go) : <div className="empty"><Icon name="search" size={32} /><h3>{emptyMessage}</h3><p>Try another title or letter, or reset the filters.</p><button className="btn btn-primary" onClick={clearFilters}>Clear filters</button></div>}</section> : <>
    {overview && config && <section className="section container"><SectionHead eyebrow={`${directoryEntries.length} ${config.noun}`} title={config.heading} />{directoryEntries.length ? <div className="library-directory-grid">{directoryEntries.map((entry: LyricsBrowseEntry) => <button key={entry.id} onClick={() => handleCategoryChange(`${activeRoute}?${config.parameter}=${encodeURIComponent(entry.id)}`)}><span>{entry.name}</span><small>{entry.lyrics.length} {entry.lyrics.length === 1 ? "title" : "titles"}</small></button>)}</div> : <div className="empty"><Icon name="search" size={32} /><h3>No {config.noun} match those filters.</h3><p>Try another search or letter.</p><button className="btn btn-primary" onClick={clearFilters}>Clear filters</button></div>}</section>}
    {selected && <section className="section container"><SectionHead eyebrow={resultEyebrow} title={resultTitle} action={`Back to ${config.heading}`} onAction={returnToOverview} />{resultLyrics.length ? renderLyricCards(resultLyrics, go) : <div className="empty"><Icon name="search" size={32} /><h3>{emptyMessage}</h3><p>Try another title or letter, or return to the overview.</p><button className="btn btn-primary" onClick={clearFilters}>Clear filters</button></div>}</section>}
    {!config && <section className="section container"><SectionHead eyebrow="Lyrics library" title="Recently Published" />{allLyrics.length ? renderLyricCards(allLyrics, go) : <div className="empty"><Icon name="search" size={32} /><h3>{emptyMessage}</h3><p>Try another title or letter, or reset the filters.</p><button className="btn btn-primary" onClick={clearFilters}>Clear filters</button></div>}</section>}
  </>}</main>;
}

function LyricsDirectoryPage({ go, title, description, heading, items, activeRoute, emptyMessage, resourceName }: { go: (r: Route) => void; title: string; description: string; heading: string; items: any[]; activeRoute: string; emptyMessage: string; resourceName: string }) {
  return <main><DirectoryHeader go={go} title={title} text={description} /><LyricsSubNav go={go} active={activeRoute} /><section className="section container"><SectionHead eyebrow={`${items.length} ${resourceName}`} title={heading} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>{emptyMessage}</h3><p>Try another library category to continue browsing.</p></div>}</section></main>;
}

function LyricsCategoryPage({ go }: { go: (r: Route) => void }) {
  const slug = getRouteQueryParam("category");
  const categoryOptions = lyricCategories.map((entry) => ({ ...entry, count: getLyricsByCategory(lyricLibrary, entry.id).length }));
  const category = categoryOptions.find((entry) => entry.id === slug) || categoryOptions[0];
  const items = category ? getLyricsByCategory(lyricLibrary, category.id) : [];

  return <main><DirectoryHeader go={go} title="Categories" text="Browse devotional compositions by their form and tradition." /><LyricsSubNav go={go} active="lyrics-category" /><section className="section container"><div className="library-directory-grid">{categoryOptions.map((entry) => <button key={entry.id} className={category?.id === entry.id ? "active" : ""} onClick={() => go(`lyrics-category?category=${entry.id}`)}><span>{entry.name}</span><small>{entry.count} titles</small></button>)}</div></section><section className="section container"><SectionHead eyebrow={`${items.length} titles`} title={category ? `${category.name} lyrics` : "Category library"} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>No lyrics are currently published in this category.</h3></div>}</section></main>;
}

function LyricsArtistPage({ go }: { go: (r: Route) => void }) {
  const slug = getRouteQueryParam("artist");
  const artistOptions = artists.map((entry) => ({ ...entry, count: getLyricsByArtist(lyricLibrary, entry.id).length }));
  const artist = artistOptions.find((entry) => entry.id === slug) || artistOptions[0];
  const items = artist ? getLyricsByArtist(lyricLibrary, artist.id) : [];

  return <main><DirectoryHeader go={go} title="Naat-Khwaan / Reciters" text="Explore lyrics by the voice that recites them." /><LyricsSubNav go={go} active="lyrics-artists" /><section className="section container"><div className="library-directory-grid">{artistOptions.map((entry) => <button key={entry.id} className={artist?.id === entry.id ? "active" : ""} onClick={() => go(`lyrics-artists?artist=${entry.id}`)}><span>{entry.name}</span><small>{entry.count} titles</small></button>)}</div></section><section className="section container"><SectionHead eyebrow={`${items.length} titles`} title={artist ? `${artist.name} recordings` : "Artist directory"} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>This reciter is not currently linked to any published lyrics.</h3></div>}</section></main>;
}

function LyricsPoetPage({ go }: { go: (r: Route) => void }) {
  const slug = getRouteQueryParam("poet");
  const poetOptions = poets.map((entry) => ({ ...entry, count: getLyricsByPoet(lyricLibrary, entry.id).length }));
  const poet = poetOptions.find((entry) => entry.id === slug) || poetOptions[0];
  const items = poet ? getLyricsByPoet(lyricLibrary, poet.id) : [];

  return <main><DirectoryHeader go={go} title="Poets / Writers" text="Browse lyrics by the writer credited with the composition." /><LyricsSubNav go={go} active="lyrics-poets" /><section className="section container"><div className="library-directory-grid">{poetOptions.map((entry) => <button key={entry.id} className={poet?.id === entry.id ? "active" : ""} onClick={() => go(`lyrics-poets?poet=${entry.id}`)}><span>{entry.name}</span><small>{entry.count} titles</small></button>)}</div></section><section className="section container"><SectionHead eyebrow={`${items.length} titles`} title={poet ? `${poet.name} compositions` : "Poet directory"} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>No published lyrics are currently attributed to this writer.</h3></div>}</section></main>;
}

function LyricsBookPage({ go }: { go: (r: Route) => void }) {
  const slug = getRouteQueryParam("book");
  const bookOptions = lyricBooks.map((entry) => ({ ...entry, count: getLyricsByBook(lyricLibrary, entry.id).length }));
  const book = bookOptions.find((entry) => entry.id === slug) || bookOptions[0];
  const items = book ? getLyricsByBook(lyricLibrary, book.id) : [];

  return <main><DirectoryHeader go={go} title="Books" text="Browse lyrics linked to a source collection or devotional anthology." /><LyricsSubNav go={go} active="lyrics-books" /><section className="section container"><div className="library-directory-grid">{bookOptions.map((entry) => <button key={entry.id} className={book?.id === entry.id ? "active" : ""} onClick={() => go(`lyrics-books?book=${entry.id}`)}><span>{entry.title}</span><small>{entry.count} titles</small></button>)}</div></section><section className="section container"><SectionHead eyebrow={`${items.length} titles`} title={book ? `${book.title}` : "Book library"} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>No published lyrics are currently linked to this book.</h3></div>}</section></main>;
}

function LyricsLanguagePage({ go }: { go: (r: Route) => void }) {
  const slug = getRouteQueryParam("language") || "ur";
  const languageOptions = Array.from(new Set(getPublishedLyrics(lyricLibrary).flatMap((lyric) => lyric.languageVersions.map((version) => version.code)))).map((code) => ({ code, count: getLyricsByLanguage(lyricLibrary, code).length }));
  const language = languageOptions.find((entry) => entry.code === slug) || languageOptions[0];
  const items = language ? getLyricsByLanguage(lyricLibrary, language.code) : [];

  return <main><DirectoryHeader go={go} title="Language" text="Find lyrics by the language version available in the library." /><LyricsSubNav go={go} active="lyrics-languages" /><section className="section container"><div className="library-directory-grid">{languageOptions.map((entry) => <button key={entry.code} className={language?.code === entry.code ? "active" : ""} onClick={() => go(`lyrics-languages?language=${entry.code}`)}><span>{entry.code.toUpperCase()}</span><small>{entry.count} titles</small></button>)}</div></section><section className="section container"><SectionHead eyebrow={`${items.length} titles`} title={language ? `Lyrics in ${language.code.toUpperCase()}` : "Available languages"} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>No lyrics are currently available in this language version.</h3></div>}</section></main>;
}

function LyricsSubjectPage({ go }: { go: (r: Route) => void }) {
  const slug = getRouteQueryParam("subject");
  const subjectOptions = lyricSubjects.map((entry) => ({ ...entry, count: getLyricsBySubject(lyricLibrary, entry.id).length }));
  const subject = subjectOptions.find((entry) => entry.id === slug) || subjectOptions[0];
  const items = subject ? getLyricsBySubject(lyricLibrary, subject.id) : [];

  return <main><DirectoryHeader go={go} title="Subject / Occasion" text="Find lyrics connected to the event, place, or remembrance theme they celebrate." /><LyricsSubNav go={go} active="lyrics-subjects" /><section className="section container"><div className="library-directory-grid">{subjectOptions.map((entry) => <button key={entry.id} className={subject?.id === entry.id ? "active" : ""} onClick={() => go(`lyrics-subjects?subject=${entry.id}`)}><span>{entry.name}</span><small>{entry.count} titles</small></button>)}</div></section><section className="section container"><SectionHead eyebrow={`${items.length} titles`} title={subject ? `${subject.name} lyrics` : "Subjects and occasions"} />{items.length ? renderLyricCards(items, go) : <div className="empty"><Icon name="book" size={32} /><h3>No lyrics are available for this subject or occasion yet.</h3></div>}</section></main>;
}

function LyricDetail({ go }: { go: (r: Route) => void }) {
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
    return <main className="reading-bg"><div className="container narrow"><Breadcrumbs items={["Lyrics", "Not found"]} go={go} /><div className="empty"><Icon name="book" size={32} /><h3>Lyric not found</h3><p>The requested lyric is unavailable in the current library. Try browsing from the main Lyrics page.</p><button className="btn btn-primary" onClick={() => go("lyrics")}>Back to all lyrics</button></div></div></main>;
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

  return <main className="reading-bg"><div className="container narrow"><Breadcrumbs items={["Lyrics", lyric.title]} go={go} /><article className="lyric-reading lyric-detail-page"><span className="badge">{getLyricCategoryNames(lyric).join(" • ") || "Devotional"}</span><h1>{lyric.title}</h1>{lyric.tags?.[0] ? <p className="lead">{lyric.tags[0]} and remembrance</p> : null}<div className="lyric-toolbar"><div className="lyric-toolbar-left"><label className="lang-select"><span className="sr-only">Select language</span><select aria-label="Select lyric language" value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)}>{lyric.languageVersions.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}</select></label></div><div className="lyric-toolbar-actions"><Btn variant="outline" icon={copied ? "check" : "copy"} onClick={() => void copy()}>{copied ? "Copied" : "Copy Lyrics"}</Btn><Btn variant="outline" icon="share" onClick={() => void share()}>Share</Btn></div></div>{shareMessage && <div className="lyric-share-status">{shareMessage}</div>}{lyric.tags?.length ? <div className="tag-row">{lyric.tags.map((tag) => <span key={tag} className="badge soft-badge">#{tag}</span>)}</div> : null}<div className="lyrics-text" lang={version.code} dir={version.dir || "ltr"}><p>{version.text.split("\n").map((line, index) => <span key={`${version.code}-${index}`}><span>{line}</span>{index < version.text.split("\n").length - 1 ? <br /> : null}</span>)}</p>{lyric.tags?.length ? <aside>Keywords: {lyric.tags.join(" • ")}</aside> : null}</div><div className="detail-meta-row">{metadataFields.map(([label, value]) => <div key={label} className="detail-meta-item"><small>{label}</small><span>{value}</span></div>)}</div></article>{lyric.relatedAudio?.length ? <section className="related"><SectionHead title="Related Audio" action="Back to Lyrics" onAction={() => go("lyrics")} /><div className="audio-grid light">{lyric.relatedAudio.map((item) => <article className="audio-card reveal" key={item.title}><div className="audio-art green"><div className="arch-art"><span>ذِكْر</span></div><button className="play-btn" aria-label={`Play ${item.title}`} onClick={() => window.open(item.url, "_blank", "noopener")}><Icon name="play" /></button></div><div className="audio-info"><span className="badge">Audio</span><h3>{item.title}</h3><p>Related to {lyric.title}</p><div className="media-meta"><span>Link</span><span>Available</span></div></div></article>)}</div></section> : null}{lyric.relatedVideos?.length ? <section className="related"><SectionHead title="Related Videos" /><div className="audio-grid light">{lyric.relatedVideos.map((video) => <article className="audio-card reveal" key={video.title}><div className="audio-art gold"><div className="arch-art"><span>▶</span></div><button className="play-btn" aria-label={`Open ${video.title}`} onClick={() => window.open(video.url, "_blank", "noopener")}><Icon name="play" /></button></div><div className="audio-info"><span className="badge">Video</span><h3>{video.title}</h3><p>YouTube reference</p><div className="media-meta"><span>Shareable</span><span>Watch</span></div></div></article>)}</div></section> : null}<section className="related"><SectionHead title="Related Lyrics" action="Read All Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{relatedLyrics.map((item, index) => <LyricsCard item={item} index={index} key={item.id} onClick={() => go(`lyric-detail?id=${item.id}`)} />)}</div></section></div></main>;
}

function QuranHome({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const filteredSurahs = filterQuranSurahs(surahs, search).slice(0, 6);
  const handleBrowseSelect = (item: (typeof quranBrowseItems)[number]) => {
    setSearch("");
    go(quranBrowseMap[item]);
  };

  return <main><PageHero eyebrow="THE HOLY QURAN" title="Read. Reflect. Return." text="A calm and respectful space to explore the Quran, Surah by Surah."><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory="Quran Home" onSelectCategory={handleBrowseSelect} /></PageHero><section className="section container"><div className="browse-cards"><button onClick={() => go("surahs")}><span>114</span><div><b>Browse by Surah</b><small>Explore every chapter in order</small></div><Icon name="arrow" /></button><button onClick={() => go("para")}><span>30</span><div><b>Browse by Para</b><small>Read by Juz division</small></div><Icon name="arrow" /></button></div><SectionHead eyebrow="Continue Exploring" title="Surahs of the Quran" action="View all 114 Surahs" onAction={() => go("surahs")} /><SurahGrid go={go} items={search.trim() ? filteredSurahs : surahs.slice(0, 6)} /></section></main>;
}

function SurahGrid({ go, items = surahs }: { go: (r: Route) => void; items?: string[][] }) {
  return <div className="surah-grid">{items.map(x => <button key={x[0]} onClick={() => go(`surah-read?surah=${Number(x[0])}&ayah=1`)}><span className="surah-no">{x[0]}</span><div><b>{x[2]}</b><small>{x[3]} • {x[4]}</small></div><strong lang="ar" dir="rtl">{x[1]}</strong></button>)}</div>;
}

function SurahDirectory({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const shown = filterQuranSurahs(surahs, search);
  const handleBrowseSelect = (item: (typeof quranBrowseItems)[number]) => {
    setSearch("");
    go(quranBrowseMap[item]);
  };

  return <main><DirectoryHeader go={go} title="Surah Directory" text="Browse all 114 Surahs of the Holy Quran in their established order." /><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory="Surah Directory" onSelectCategory={handleBrowseSelect} /><section className="section container"><div className="directory-summary"><span>{shown.length} Surahs</span><small>Ordered from Al-Fatihah to An-Nas</small></div><SurahGrid go={go} items={shown} /></section></main>;
}

function SurahRead({ go, isLoggedIn, onRequireAuthentication }: { go: (r: Route) => void; isLoggedIn: boolean; onRequireAuthentication: (action: string, contentType: string, contentId: string) => boolean }) {
  const location = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const requestedSurah = Number(location.get("surah")) || 1;
  const initialSurah = Math.min(surahData.length, Math.max(1, requestedSurah));
  const [surahNumber, setSurahNumber] = useState(initialSurah);
  const [ayahNumber, setAyahNumber] = useState(() => {
    const chapter = surahData[initialSurah - 1];
    const requestedAyah = Number(location.get("ayah")) || 1;
    return Math.min(chapter[2], Math.max(1, requestedAyah));
  });
  const [selectedTranslation, setSelectedTranslation] = useState<TranslationLanguage>("en");
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
      setSurahNumber(nextSurah);
      setAyahNumber(nextAyah);
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
    const url = `#surah-read?surah=${nextSurah}&ayah=${nextAyah}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
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
      <button className="reader-current-surah" onClick={() => { setNavTab("Surah"); setNavOpen(true); }} aria-label="Open Surah navigation">{String(chapterNumber).padStart(2, "0")} · {transliteratedName}<span>⌄</span></button>
      <div className="reader-location">{mappedPage ? `Page ${mappedPage}` : "Page mapping unavailable"}<i />Juz {activeJuz} / Hizb mapping unavailable</div>
      <div className="reader-modes" role="group" aria-label="Reader mode"><button className={mode === "verses" ? "active" : ""} onClick={() => setMode("verses")}>Verse by Verse</button><button className={mode === "reading" ? "active" : ""} onClick={() => setMode("reading")}>Reading</button></div>
    </div>
    <div className="quran-reader-body">
      <section className="quran-reader-content">
        <div className="reader-toolbar-actions"><button className="reader-nav-open" onClick={() => { setNavTab("Surah"); setNavOpen(true); }}><Icon name="menu" size={17} /> Browse</button><button className="reader-translation-open" onClick={() => setTranslationOpen(true)}>Translation: {translationResources.find(item => item.languageCode === selectedTranslation)?.language}<span>⌄</span></button></div>
        <section className="reader-chapter-card">
          <strong className="reader-chapter-arabic" lang="ar" dir="rtl">{arabicName}</strong>
          <div className="reader-chapter-copy"><span>Surah {chapterNumber}</span><h1>{transliteratedName} <em>{surahMeanings[chapterNumber - 1]}</em></h1><p>{revelation} • {ayahCount} Ayat • Local reader mock data</p></div>
          <div className="reader-chapter-actions"><button onClick={() => startAudio()}><Icon name="play" size={15} /> Listen</button><button onClick={() => setInfoOpen(open => !open)}><span aria-hidden="true">ⓘ</span> Info</button><button className="translation-desktop" onClick={() => setTranslationOpen(true)}>Translation: {translationResources.find(item => item.languageCode === selectedTranslation)?.name} <span>⌄</span></button></div>
        </section>
        {infoOpen && <div className="reader-info-panel"><b>About this Surah</b><span>Chapter {chapterNumber} in canonical order</span><span>{revelation} revelation • {ayahCount} Ayat</span><span>English meaning: {surahMeanings[chapterNumber - 1]}</span></div>}
        <div className="reader-data-note" role="note"><Icon name="book" size={16} /><p>Ayah numbering follows chapter metadata. Local text is available only for 1:1; other slots are intentionally left without Quran text or translation.</p></div>
        <div className={`reader-ayah-list ${mode === "reading" ? "reading-mode" : "verse-mode"}`}>
          {Array.from({ length: ayahCount }, (_, index) => {
            const number = index + 1;
            const reference = chapterNumber * 1000 + number;
            const { content, translation } = ayahTextFor(number);
            const resource = translationResources.find(item => item.languageCode === selectedTranslation);
            const isBookmarked = bookmarks.includes(reference);
            return <article id={`ayah-${chapterNumber}-${number}`} key={`${chapterNumber}:${number}`} className={`reader-ayah ${highlightedAyah === number ? "is-highlighted" : ""} ${!content ? "content-unavailable" : ""}`}>
              <div className="reader-ayah-actions"><div><span className="ayah-reference">{chapterNumber}:{number}</span><button aria-label={`Play Ayah ${chapterNumber}:${number}`} onClick={() => startAudio(number)}>{audioPlaying && ayahNumber === number ? <span>Ⅱ</span> : <Icon name="play" size={17} />}</button><button aria-label={`${isBookmarked ? "Remove bookmark from" : "Bookmark"} Ayah ${chapterNumber}:${number}`} className={isBookmarked ? "bookmarked" : ""} onClick={() => toggleBookmark(reference)}><Icon name="heart" size={17} /></button></div><div><button aria-label={`Copy Ayah ${chapterNumber}:${number}`} onClick={() => void copyAyah(number)}><Icon name="copy" size={17} /></button><button aria-label={`Share Ayah ${chapterNumber}:${number}`} onClick={() => void shareAyah(number)}><Icon name="share" size={17} /></button></div></div>
              {content?.arabic ? <p className="reader-arabic" lang="ar" dir="rtl" translate="no">{content.arabic}</p> : <p className="ayah-unavailable">Quran text unavailable in the local mock data.</p>}
              {translation ? <p className={`reader-translation-text language-${selectedTranslation}`} lang={selectedTranslation} dir={selectedTranslation === "ur" ? "rtl" : "ltr"}>{translation}</p> : <p className="translation-unavailable">{content ? `No ${resource?.language || "selected language"} translation is available for this Ayah.` : "Translation unavailable for this Ayah in the local mock data."}</p>}
              {content && <small className="content-attribution">Existing prototype sample • translation attribution not recorded</small>}
            </article>;
          })}
        </div>
        <nav className="reader-surah-pager" aria-label="Surah navigation"><button disabled={chapterNumber === 1} onClick={() => selectSurah(chapterNumber - 1)}>← Previous Surah</button><button onClick={() => { setNavTab("Surah"); setNavOpen(true); }}>All Surahs</button><button disabled={chapterNumber === surahData.length} onClick={() => selectSurah(chapterNumber + 1)}>Next Surah →</button></nav>
      </section>
    </div>
    {notice && <div className="reader-notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="x" size={15} /></button></div>}

    {navOpen && <div className="quran-drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setNavOpen(false); }}><aside className="quran-drawer quran-nav-drawer" role="dialog" aria-modal="true" aria-label="Quran navigation">
      <div className="drawer-heading"><div><small>QURAN NAVIGATION</small><h2>{String(chapterNumber).padStart(2, "0")} · {transliteratedName}</h2></div><button aria-label="Close navigation" onClick={() => setNavOpen(false)}><Icon name="x" /></button></div>
      <div className="drawer-tabs" role="tablist" aria-label="Navigate by"><button role="tab" aria-selected={navTab === "Surah"} className={navTab === "Surah" ? "active" : ""} onClick={() => setNavTab("Surah")}>Surah</button><button role="tab" aria-selected={navTab === "Verse"} className={navTab === "Verse" ? "active" : ""} onClick={() => setNavTab("Verse")}>Verse</button><button role="tab" aria-selected={navTab === "Juz"} className={navTab === "Juz" ? "active" : ""} onClick={() => setNavTab("Juz")}>Juz</button><button role="tab" aria-selected={navTab === "Page"} className={navTab === "Page" ? "active" : ""} onClick={() => setNavTab("Page")}>Page</button></div>
      {navTab === "Surah" && <><label className="drawer-search"><Icon name="search" size={17} /><input autoFocus value={surahSearch} onChange={event => setSurahSearch(event.target.value)} placeholder="Search Surah" /></label><div className="surah-drawer-list">{filteredSurahs.map(({ item, number }) => <button key={number} className={chapterNumber === number ? "selected" : ""} onClick={() => selectSurah(number)}><span>{number}</span><b>{item[1]}</b><small>{surahMeanings[number - 1]}</small><strong lang="ar" dir="rtl">{item[0]}</strong></button>)}{!filteredSurahs.length && <p className="drawer-empty">No Surahs match that search.</p>}</div></>}
      {navTab === "Verse" && <div className="verse-navigation">
        <section className="verse-surah-column" aria-label="Select Surah">
          <label className="drawer-search"><Icon name="search" size={17} /><input autoFocus value={surahSearch} onChange={event => setSurahSearch(event.target.value)} placeholder="Search Surah" /></label>
          <div className="verse-surah-list">{filteredSurahs.map(({ item, number }) => <button key={number} className={chapterNumber === number ? "selected" : ""} aria-current={chapterNumber === number ? "true" : undefined} onClick={() => selectVerseSurah(number)}><span>{number}</span><b>{item[1]}</b></button>)}{!filteredSurahs.length && <p className="drawer-empty">No Surahs match that search.</p>}</div>
        </section>
        <section className="verse-ayah-column" aria-label={`Ayat in ${transliteratedName}`}>
          <h3>Ayah <small>{chapterNumber}. {transliteratedName}</small></h3>
          <div className="verse-ayah-list">{Array.from({ length: ayahCount }, (_, index) => index + 1).map(number => <button key={`${chapterNumber}:${number}`} className={ayahNumber === number ? "selected" : ""} aria-current={ayahNumber === number ? "true" : undefined} onClick={() => navigateToAyah(chapterNumber, number)}>{number}</button>)}</div>
        </section>
      </div>}
      {navTab === "Juz" && <><p className="drawer-description">Select a Juz to navigate to its listed starting Ayah.</p><div className="juz-drawer-list">{juzStarts.map(start => <button key={start.juz} onClick={() => selectJuz(start.juz)} className={activeJuz === start.juz ? "selected" : ""}><span>Juz {start.juz}</span><small>Starts at {start.surah}:{start.ayah} · {surahData[start.surah - 1][1]}</small><Icon name="chevron" size={16} /></button>)}</div></>}
      {navTab === "Page" && <div className="page-navigation"><h3>Madani Mushaf sample mapping</h3><p>Only two local page-start mappings are included. This is not a complete page index.</p>{mushafPageStarts.map(start => <button key={start.page} className={mappedPage === start.page ? "selected" : ""} onClick={() => selectPage(start.page)}><span>Page {start.page}</span><small>Starts at {start.surah}:{start.ayah} · {surahData[start.surah - 1][1]}</small><Icon name="chevron" size={16} /></button>)}</div>}
    </aside></div>}

    {translationOpen && <div className="quran-drawer-backdrop translation-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setTranslationOpen(false); }}><aside className="quran-drawer translation-drawer" role="dialog" aria-modal="true" aria-label="Translations"><div className="drawer-heading"><div><small>DISPLAY SETTINGS</small><h2>Translations</h2></div><button aria-label="Close translations" onClick={() => setTranslationOpen(false)}><Icon name="x" /></button></div><label className="drawer-search"><Icon name="search" size={17} /><input autoFocus value={translationSearch} onChange={event => setTranslationSearch(event.target.value)} placeholder="Search translations" /></label><div className="translation-options">{[...new Set(filteredTranslations.map(resource => resource.language))].map(language => <section key={language}><h3>{language}</h3>{filteredTranslations.filter(resource => resource.language === language).map(resource => <label key={resource.id} className={`translation-option ${selectedTranslation === resource.languageCode ? "selected" : ""}`}><input type="radio" name="translation" checked={selectedTranslation === resource.languageCode} onChange={() => setSelectedTranslation(resource.languageCode)} /><span><b>{resource.name}</b><small>{resource.attribution}</small></span><span className="translation-check">{selectedTranslation === resource.languageCode ? "Selected" : ""}</span></label>)}</section>)}{!filteredTranslations.length && <p className="drawer-empty">No translations match that search.</p>}</div><button className="drawer-done" onClick={() => setTranslationOpen(false)}>Done</button></aside></div>}

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
    {activeAudioTitle && <div className="quran-bottom-player" aria-label="Quran audio player">
      <div className="quran-player-track"><b>{activeAudioTitle}</b><small>{audioUnavailable ? "Audio unavailable · no playable source configured" : audioSources[chapterNumber]?.reciter || ayahAudioSources[`${chapterNumber}:${ayahNumber}`]?.reciter || "Quran recitation"}</small></div>
      <button aria-label="Previous Ayah" title="Previous Ayah" disabled={audioUnavailable || currentAudioSegmentIndex <= 0} onClick={() => moveAudioByAyah(-1)}>‹</button>
      <button aria-label={audioPlaying ? "Pause recitation" : "Play recitation"} disabled={audioUnavailable} onClick={() => {
        const player = audioRef.current;
        if (!player) return;
        if (audioPlaying) player.pause();
        else void player.play().catch(() => setNotice("The configured recitation could not be played."));
      }}>{audioPlaying ? "Ⅱ" : <Icon name="play" />}</button>
      <button aria-label="Next Ayah" title="Next Ayah" disabled={audioUnavailable || currentAudioSegmentIndex < 0 || currentAudioSegmentIndex >= audioSegments.length - 1} onClick={() => moveAudioByAyah(1)}>›</button>
      <input type="range" min="0" max={audioDuration} value={Math.min(audioProgress, audioDuration)} disabled={audioUnavailable || !audioDuration} onChange={event => seekAudio(Number(event.target.value))} aria-label="Recitation progress" />
      <span className="quran-player-time">{`${Math.floor(audioProgress / 60)}:${String(Math.floor(audioProgress % 60)).padStart(2, "0")}`} / {audioDuration ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, "0")}` : "--:--"}</span>
      <label className="quran-player-volume" title="Volume"><Icon name="volume" size={17} /><input type="range" min="0" max="1" step="0.05" value={volume} disabled={audioUnavailable} onChange={event => { const nextVolume = Number(event.target.value); setVolume(nextVolume); if (audioRef.current) audioRef.current.volume = nextVolume; }} aria-label="Volume" /></label>
      <button aria-label="Close player" onClick={stopAudio}>×</button>
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

  return <main><DirectoryHeader go={go} title="Para Directory" text="Browse the Holy Quran through its 30 traditional Juz divisions." /><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory="Para Directory" onSelectCategory={handleBrowseSelect} /><section className="section container"><div className="para-grid">{shown.map((item) => <button key={item.number} onClick={() => go(`surah-read?surah=${item.startSurah}&ayah=${item.startAyah}`)}><span>{String(item.number).padStart(2, "0")}</span><div><b>{item.label}</b><small>Juz {item.number} • {item.surahName}</small></div><Icon name="chevron" /></button>)}</div>{!shown.length && <div className="empty"><Icon name="search" size={32} /><h3>No Para match that search.</h3><p>Try a number, Juz name, or starting Surah reference.</p></div>}</section></main>;
}

function QuranTopics({ go }: { go: (r: Route) => void }) {
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

  return <main><DirectoryHeader go={go} title="Quranic Topics & Quotes" text="Explore an editorial index designed to guide thoughtful study. Published content must use verified source text and attribution." /><QuranSearchAndBrowse search={search} setSearch={setSearch} activeCategory={selectedView as (typeof quranBrowseItems)[number]} onSelectCategory={handleBrowseSelect} /><section className="section container"><div className="topic-grid">{shown.map((x, i) => <button key={x}><span>0{i + 1}</span><b>{x}</b><small>Curated references</small><Icon name="arrow" /></button>)}{!shown.length && <div className="empty"><Icon name="search" size={32} /><h3>No Quran topic matches that search.</h3><p>Try a different topic title or phrase.</p></div>}</div><div className="notice"><Icon name="book" /><div><b>Respectful by design</b><p>Quranic quotations will only be displayed after verification against authoritative source data and translation attribution.</p></div></div></section></main>;
}

function AudioPage({ go, onPlayAudio, onDownloadAudio, activeAudioId }: { go: (r: Route) => void; onPlayAudio: (track: (typeof audioLibrary)[number]) => void; onDownloadAudio: (track: (typeof audioLibrary)[number]) => void; activeAudioId: string | null }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All Audio");
  const categories = audioCategories.map((entry) => entry.name);
  const shown = filterAudioLibrary(audioLibrary, { search, category: tab });

  return <main><DirectoryHeader go={go} title="Devotional Audio" text="Listen to soulful recitations, Naats, Hamd, and timeless devotional works." /><div className="container directory-controls"><div className="lyrics-search-row"><SearchBox value={search} setValue={setSearch} placeholder="Search audio or artist" /><CategoryBrowseControl items={categories} value={tab} onChange={setTab} /></div></div><section className="section container"><SectionHead eyebrow={`${shown.length} tracks • newest first`} title="Latest Audio" />{shown.length ? <div className="audio-grid light">{shown.map((x, i) => <AudioCard key={x.id} item={x} index={i} onClick={() => go(`audio-detail?id=${x.id}`)} onPlay={onPlayAudio} onDownload={onDownloadAudio} activeAudioId={activeAudioId || ""} />)}</div> : <div className="empty"><Icon name="search" size={32} /><h3>No audio matches that search.</h3><p>Try another title, reciter name, or category filter.</p><button className="btn btn-primary" onClick={() => { setSearch(""); setTab("All Audio"); }}>Clear filters</button></div>}</section></main>;
}

function AudioDetail({ go, onPlayAudio, onDownloadAudio, activeAudioId }: { go: (r: Route) => void; onPlayAudio: (track: (typeof audioLibrary)[number]) => void; onDownloadAudio: (track: (typeof audioLibrary)[number]) => void; activeAudioId: string | null }) {
  const detailId = getRouteQueryParam("id") || audioLibrary[0]?.id || "";
  const track = getAudioById(detailId) || audioLibrary[0];
  if (!track) {
    return <main className="reading-bg"><div className="container"><Breadcrumbs items={["Audio", "Not found"]} go={go} /><div className="empty"><Icon name="headphones" size={32} /><h3>Audio not found</h3><p>The selected devotional track is not available in this library.</p><button className="btn btn-primary" onClick={() => go("audio")}>Back to audio</button></div></div></main>;
  }

  const relatedLyrics = (track.relatedLyrics || []).map((lyricId) => findLyricById(lyricId)).filter(Boolean);
  const moreAudio = audioLibrary.filter((entry) => entry.id !== track.id).slice(0, 2);

  return <main className="reading-bg"><div className="container"><Breadcrumbs items={["Audio", track.title]} go={go} /><div className="audio-detail"><div className={`audio-art ${track.color} large`}><img src={track.image} alt="" loading="lazy" /><span className="media-overlay" /><div className="arch-art"><span>ذِكْر</span></div><button className="play-btn" onClick={() => onPlayAudio(track)} aria-label={activeAudioId === track.id ? "Pause audio" : `Play ${track.title}`}>{activeAudioId === track.id ? <span className="pause">Ⅱ</span> : <Icon name="play" />}</button></div><div><span className="badge">{getAudioCategoryLabel(track)}</span><h1>{track.title}</h1><p className="lead">Recited by {track.artist}</p><div className="detail-meta"><span><small>PUBLISHED</small>{new Date(track.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span><span><small>DURATION</small>{track.duration}</span></div><div className="player"><button className="play-main" onClick={() => onPlayAudio(track)} aria-label={activeAudioId === track.id ? "Pause audio" : `Play ${track.title}`}>{activeAudioId === track.id ? <span>Ⅱ</span> : <Icon name="play" size={24} />}</button><span>0:00</span><input type="range" min="0" max="100" defaultValue="0" aria-label="Audio progress" /><span>{track.duration}</span><Icon name="volume" /></div><p className="prototype-note">{track.isDemo ? "Demo source for frontend preview — a licensed production file should replace this when the CMS or backend is connected." : "Audio stream is available for public preview."}</p><p className="audio-description">{track.description}</p><div className="button-row"><Btn variant="outline" icon="share" onClick={() => navigator.share?.({ title: track.title, url: `${window.location.origin}${window.location.pathname}#audio-detail?id=${track.id}` })}>Share</Btn>{track.downloadable ? <Btn variant="outline" icon="download" onClick={() => onDownloadAudio(track)}>Download</Btn> : <Btn variant="outline" icon="download" disabled>Download locked</Btn>}</div></div></div>{relatedLyrics.length ? <section className="related"><SectionHead title="Related Lyrics" action="Read All Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{relatedLyrics.slice(0, 2).map((x, i) => <LyricsCard item={x} index={i} key={x.id} onClick={() => go(`lyric-detail?id=${x.id}`)} />)}</div></section> : null}<section className="related"><SectionHead title="Related Audio" action="View All Audio" onAction={() => go("audio")} /><div className="audio-grid light">{moreAudio.map((x, i) => <AudioCard key={x.id} item={x} index={i} onClick={() => go(`audio-detail?id=${x.id}`)} onPlay={onPlayAudio} onDownload={onDownloadAudio} activeAudioId={activeAudioId || ""} />)}</div></section></div></main>;
}

function Services({ go }: { go: (r: Route) => void }) {
  const services = [
    ["headphones", "Naat Mixing & Mastering", "https://images.unsplash.com/photo-1761939997990-7e1635db43c5?auto=format&fit=crop&w=800&q=78"],
    ["play", "Video Editing", "https://images.unsplash.com/photo-1567712595315-545da0d341b2?auto=format&fit=crop&w=800&q=78"],
    ["grid", "Thumbnails & Posters", "https://images.unsplash.com/photo-1590273089302-ebbc53986b6e?auto=format&fit=crop&w=800&q=78"],
    ["layers", "Audio Distribution", "https://images.unsplash.com/photo-1537181534458-45dcee76ae90?auto=format&fit=crop&w=800&q=78"],
    ["user", "YouTube Channel Management", "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=800&q=78"],
  ] as [IconName, string, string][];
  const [filter, setFilter] = useState("All Work");
  return <main><section className="service-hero"><Reveal className="container"><span className="eyebrow">ZIKR CREATIVE STUDIO</span><h1>Creative Services for<br /><em>Devotional Content</em></h1><p>Thoughtful production and visual craft for voices that inspire.</p><Btn onClick={() => go("contact")} icon="arrow">Start a Conversation</Btn></Reveal></section><section className="section container"><SectionHead eyebrow="What We Do" title="Made with care. Built to resonate." /><div className="services-grid">{services.map(([icon, title, image], i) => <Reveal className="service-reveal" delay={i * 80} key={title}><article><div className="service-image"><img src={image} alt="" loading="lazy" /><span>0{i + 1}</span></div><div className="service-card-body"><div className="service-icon"><Icon name={icon} /></div><h3>{title}</h3><p>Professional, respectful creative support tailored for Islamic devotional content and its audience.</p><Btn variant="outline" onClick={() => go("contact")}>Get Service</Btn></div></article></Reveal>)}</div></section><section className="portfolio"><div className="container"><SectionHead eyebrow="Selected Work" title="Our Portfolio" body="A glimpse at devotional projects crafted with purpose." /><Tabs items={["All Work", "Audio", "Video", "Design"]} active={filter} setActive={setFilter} /><div className="portfolio-grid">{[photos.minaret, photos.mosque, photos.hero].map((img, i) => <Reveal delay={i * 90} key={img}><article><img src={img} alt="Mosque architecture project artwork" loading="lazy" /><div><span>{["AUDIO PRODUCTION", "VIDEO EDIT", "COVER DESIGN"][i]}</span><h3>{["Echoes of Devotion", "Journey to Madina", "The Remembrance Series"][i]}</h3></div></article></Reveal>)}</div></div></section></main>;
}

function Ebooks({ go, onDownloadBook }: { go: (r: Route) => void; onDownloadBook: (book: (typeof ebookLibrary)[number]) => void }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All Books");
  const categories = ebookCategories.map((entry) => entry.name);
  const filteredBooks = filterEbooks(ebookLibrary, { search, category: tab });

  return <main><DirectoryHeader go={go} title="Islamic E-Books Library" text="A considered collection of devotional literature for reading, reflection, and learning." /><div className="container directory-controls"><div className="lyrics-search-row"><SearchBox value={search} setValue={setSearch} placeholder="Search books or authors" /><CategoryBrowseControl items={categories} value={tab} onChange={setTab} /></div></div><section className="section container"><SectionHead eyebrow={`${filteredBooks.length} books • newest first`} title="Latest Uploads" />{filteredBooks.length ? <div className="book-grid">{filteredBooks.map((book, index) => <BookCard item={book} index={index} key={book.id} onClick={() => go(`book-detail?id=${book.id}`)} onDownload={onDownloadBook} />)}</div> : <div className="empty"><Icon name="book" size={32} /><h3>No books match that search or category.</h3><p>Try another keyword or reset the filter to browse the latest titles.</p><button className="btn btn-primary" onClick={() => { setSearch(""); setTab("All Books"); }}>Clear filters</button></div>}</section></main>;
}

function BookDetail({ go, isLoggedIn, onDownloadBook }: { go: (r: Route) => void; isLoggedIn: boolean; onDownloadBook: (book: (typeof ebookLibrary)[number]) => void }) {
  const detailId = getRouteQueryParam("id") || ebookLibrary[0]?.id || "";
  const book = getEbookById(detailId) || ebookLibrary[0];

  if (!book) {
    return <main className="reading-bg"><div className="container"><Breadcrumbs items={["E-Books", "Not found"]} go={go} /><div className="empty"><Icon name="book" size={32} /><h3>Book not found</h3><p>The selected publication is not available in the current library.</p><button className="btn btn-primary" onClick={() => go("ebooks")}>Back to library</button></div></div></main>;
  }

  const relatedBooks = (book.relatedBooks || []).map((id) => getEbookById(id)).filter(Boolean);
  const canDownload = book.downloadable && isAvailableDownloadUrl(book.downloadUrl);
  const accessLabel = canDownload ? (isLoggedIn ? book.access : "Login required to download") : "Download unavailable";

  return <main className="reading-bg"><div className="container"><Breadcrumbs items={["E-Books", book.title]} go={go} /><div className="book-detail"><div className={`book-cover ${book.color} large-cover`}><span className="cover-ornament">۞</span><small>ZIKR-E-ILAHI LIBRARY</small><b>{book.title}</b><i>{book.author}</i></div><div><span className="badge">{book.category}</span><h1>{book.title}</h1><p className="lead">{book.author}</p><div className="detail-meta"><span><small>LANGUAGE</small>{book.language}</span><span><small>FORMAT</small>{book.format}</span><span><small>ACCESS</small>{accessLabel}</span></div><h3>About this book</h3><p>{book.description}</p><div className="button-row"><Btn onClick={() => go(`book-reader?id=${book.id}`)} icon="book">Read Online</Btn>{canDownload ? <Btn variant="outline" icon="download" onClick={() => onDownloadBook(book)}>{isLoggedIn ? "Download PDF" : "Login to download"}</Btn> : <Btn variant="outline" icon="download" disabled>Download unavailable</Btn>}</div></div></div><section className="related"><SectionHead title="Related Books" /><div className="book-grid">{relatedBooks.map((item, index) => <BookCard item={item} index={index} key={item.id} onClick={() => go(`book-detail?id=${item.id}`)} onDownload={onDownloadBook} />)}</div></section></div></main>;
}

function BookReader({ go }: { go: (r: Route) => void }) {
  const detailId = getRouteQueryParam("id") || ebookLibrary[0]?.id || "";
  const book = getEbookById(detailId) || ebookLibrary[0];
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  if (!book) {
    return <main className="book-reader"><div className="reader-bar"><button onClick={() => go("ebooks")}>← Back to library</button><b>Book unavailable</b></div><div className="empty"><Icon name="book" size={32} /><h3>No reader content available.</h3><p>The requested title is not currently open for reading.</p></div></main>;
  }

  const totalPages = book.pageCount || 48;

  return <main className="book-reader"><div className="reader-bar"><button onClick={() => go(`book-detail?id=${book.id}`)}>← Return to book</button><b>{book.title}</b><div><button onClick={() => setZoom(Math.max(70, zoom - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))}>+</button><button aria-label="Full screen">⛶</button></div></div><div className="document" style={{ transform: `scale(${zoom / 100})` }}><small>ZIKR-E-ILAHI LIBRARY</small><h1>{book.title}</h1><div className="doc-ornament">۞</div><p>{book.previewText}</p><div className="reader-page-copy"><p>{book.description}</p><p>Author: {book.author}</p><p>Category: {book.category}</p></div><span>Sample page {page}</span></div><div className="page-controls"><button onClick={() => setPage(Math.max(1, page - 1))}>← Previous</button><span>Page {page} of {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))}>Next →</button></div></main>;
}

function About({ go }: { go: (r: Route) => void }) {
  return <main><section className="about-hero"><img src={photos.mosque} alt="Visitors walking beside a beautiful white mosque" /><div><span className="eyebrow">ABOUT ZIKR-E-ILAHI</span><h1>A peaceful home for<br />devotional discovery.</h1><p>Zikr-e-Ilahi is envisioned as an accessible digital space where devotional words, recitations, literature, and creative work can be explored with care.</p></div></section><section className="section container editorial"><div><span className="eyebrow">OUR PURPOSE</span><h2>Created to make remembrance feel closer.</h2></div><div><p>Our mission is to present Islamic devotional content in a calm, respectful, and readable environment. This copy is intentionally editable until the organization’s verified story and details are provided.</p><div className="values"><article><span>01</span><h3>Mission</h3><p>Make trusted devotional content easier to discover and experience.</p></article><article><span>02</span><h3>Vision</h3><p>A welcoming digital destination that nurtures reflection and learning.</p></article></div></div></section><section className="explore-links"><div className="container">{[["Lyrics", "lyrics"], ["Quran", "quran"], ["Audio", "audio"], ["E-Books", "ebooks"], ["Services", "services"]].map(([x, r]) => <button onClick={() => go(r)} key={x}>{x}<Icon name="arrow" /></button>)}</div></section></main>;
}

function Contact({ go }: { go: (r: Route) => void }) {
  const [sent, setSent] = useState(false); const [errors, setErrors] = useState(false);
  return <main><PageHero eyebrow="GET IN TOUCH" title="We'd love to hear from you." text="Questions, requests, and creative enquiries are all welcome." />
    <section className="section container contact-grid"><div><h2>Start a conversation</h2><p>Use the form and the team can respond through the eventual contact workflow. Verified email and social links will be added before launch.</p><div className="contact-note"><Icon name="mail" /><span><small>EMAIL</small>Contact details coming soon</span></div></div><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); if (!f.get("name") || !f.get("email") || !f.get("message")) { setErrors(true); return } setSent(true); setErrors(false) }}>{sent ? <div className="success"><Icon name="check" size={28} /><h3>Message received</h3><p>This prototype demonstrates the success state. Backend delivery will be connected later.</p><Btn variant="outline" onClick={() => setSent(false)}>Send another</Btn></div> : <><div className="two-fields"><FormField label="Name" name="name" /><FormField label="Email" name="email" type="email" /></div><FormField label="Subject" name="subject" /><label className="field"><span>Message</span><textarea name="message" placeholder="How can we help?" rows={6} /></label>{errors && <p className="error">Please complete your name, email, and message.</p>}<Btn type="submit" icon="arrow">Send Message</Btn></>}</form></section></main>;
}

function FormField({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} placeholder={placeholder || `Enter your ${label.toLowerCase()}`} /></label>;
}

function Auth({ mode, go }: { mode: "login" | "register"; go: (r: Route) => void }) {
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const pendingAction = readPendingAction();
    const returnTo = pendingAction ? safeReturnTo(pendingAction.returnTo, pendingAction.action) : null;
    window.localStorage.setItem("zikr-authenticated", "true");
    window.dispatchEvent(new Event("zikr-auth-state"));
    go((returnTo || "#home").slice(1));
  };

  return <main className="auth-page"><div className="auth-panel"><button onClick={() => go("home")} className="auth-logo"><Logo /></button><span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}</span><h1>{mode === "login" ? "Sign in to your account" : "Create your account"}</h1><p>{mode === "login" ? "A peaceful place to continue your journey." : "Begin your personal journey with Zikr-e-Ilahi."}</p><form onSubmit={handleSubmit}>{mode === "register" && <FormField label="Full Name" name="name" />}<FormField label={mode === "login" ? "Email or Username" : "Email"} name="email" type="email" /><label className="field"><span>Password</span><div className="password"><input name="password" type={show ? "text" : "password"} placeholder="Enter your password" /><button type="button" onClick={() => setShow(!show)}><Icon name="eye" /></button></div></label>{mode === "register" && <FormField label="Confirm Password" name="confirm" type="password" />}<label className="checkbox"><input type="checkbox" /><span>{mode === "login" ? "Remember me" : "I accept the Terms and Privacy Policy"}</span></label>{error && <p className="error">{error}</p>}<Btn type="submit">{mode === "login" ? "Sign In" : "Create Account"}</Btn></form><div className="auth-switch">{mode === "login" ? "New to Zikr-e-Ilahi?" : "Already have an account?"}<button onClick={() => go(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></div></div><div className="auth-image" style={{ backgroundImage: `linear-gradient(rgba(15,15,14,.3),rgba(15,15,14,.78)),url(${photos.minaret})` }}><blockquote>“In the remembrance of Allah do hearts find rest.”<small>QURAN 13:28</small></blockquote></div></main>;
}

function Admin({ edit = false, go }: { edit?: boolean; go: (r: Route) => void }) {
  const [preview, setPreview] = useState(false);
  const [editorOpen, setEditorOpen] = useState(edit);
  const [activeSection, setActiveSection] = useState("Lyrics");
  const nav = ["Dashboard", "Lyrics", "Quran Content", "Audio", "E-Books", "Services", "Portfolio", "Categories", "Authors / Artists", "Contact Enquiries", "Settings"];
  return <main className="admin"><aside><Logo /><small>CONTENT ADMIN</small>{nav.map((x, i) => <button className={(editorOpen && x === activeSection) || (!editorOpen && i === 0) ? "active" : ""} key={x} onClick={() => { setActiveSection(x); setEditorOpen(i !== 0) }}><Icon name={i === 0 ? "grid" : i === 1 ? "pen" : i === 3 ? "headphones" : i === 4 ? "book" : "layers"} size={17} />{x}</button>)}</aside><div className="admin-main"><header><div><small>ADMINISTRATION</small><h1>{editorOpen ? `${activeSection} Management` : "Good morning, Editor"}</h1></div><div className="admin-user">ZE</div></header>{editorOpen ? <><div className="admin-actions"><button onClick={() => setEditorOpen(false)}>← Dashboard</button><div><Btn variant="outline" onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</Btn><Btn>Save Draft</Btn></div></div>{preview ? <article className="admin-preview"><span className="badge">Draft preview</span><h1>Mustafa Jaan-e-Rehmat Pe Lakhon Salam</h1><p>Lyrics preview appears here as editors type and format content.</p></article> : <form className="editor-form"><div className="form-card"><h2>Content details</h2><p className="form-help">Create, edit, preview, publish, or archive library content. Fields adapt to the selected content type during backend integration.</p><div className="two-fields"><label className="field"><span>Content type</span><select><option>Lyrics</option><option>Audio</option><option>E-Book</option><option>Service</option><option>Portfolio</option></select></label><FormField label="Publish Date" name="date" type="date" /></div><FormField label="Title" name="title" /><div className="two-fields"><FormField label="Slug" name="slug" /><label className="field"><span>Status</span><select><option>Draft</option><option>Published</option><option>Archived</option></select></label></div><label className="field"><span>Lyrics content</span><textarea rows={10} placeholder="Enter verified lyrics content..." /></label></div><div><div className="form-card"><h2>Classification</h2><FormField label="Writer / Poet" name="writer" /><FormField label="Artist / Naatkhawan" name="artist" /><label className="field"><span>Category</span><select><option>Naat Sharif</option><option>Hamd</option><option>Manqabat</option></select></label><label className="field"><span>Language</span><select><option>Urdu</option><option>Hindi</option><option>English</option></select></label></div><div className="notice compact"><Icon name="check" /><p>Quran source content is protected through a separate verified workflow.</p></div></div></form>}</> : <AdminDashboard go={go} />}</div></main>;
}

function AdminDashboard({ go }: { go: (r: Route) => void }) {
  return <><div className="stat-grid">{[["1,248", "Published Lyrics"], ["186", "Audio Items"], ["94", "E-Books"], ["12", "Pending Content"]].map(([n, l]) => <article key={l}><span>{n}</span><small>{l}</small></article>)}</div><section className="admin-table"><div className="section-head"><div><h2>Recent uploads</h2><p>Latest activity across the library</p></div><Btn onClick={() => go("admin-edit")}>Add Content</Btn></div><div className="table-head"><span>Content</span><span>Type</span><span>Status</span><span>Published</span></div>{[["Mustafa Jaan-e-Rehmat", "Lyrics", "Published", "12 May 2025"], ["Karam Mangta Hoon", "Audio", "Published", "08 May 2025"], ["Gardens of Devotion", "E-Book", "Draft", "—"], ["Mere Aaqa Aao", "Lyrics", "Review", "02 May 2025"]].map(r => <button key={r[0]} onClick={() => go("admin-edit")}>{r.map((x, i) => <span key={x} className={i === 2 ? `status ${x.toLowerCase()}` : ""}>{x}</span>)}</button>)}</section></>;
}

function Footer({ go }: { go: (r: Route) => void }) {
  const [subscribed, setSubscribed] = useState(false);
  return <footer><div className="container footer-grid"><div><Logo /><p>A peaceful digital home for Islamic devotional content, reflection, and creative expression.</p><small className="verified-note">Social links will appear once official profiles are verified.</small></div><div><h3>Explore</h3>{[["Lyrics", "lyrics"], ["Quran", "quran"], ["Audio", "audio"], ["E-Books", "ebooks"]].map(([x, r]) => <button onClick={() => go(r)} key={x}>{x}</button>)}</div><div><h3>Discover</h3>{[["Services", "services"], ["About Us", "about"], ["Contact Us", "contact"], ["Admin", "admin"]].map(([x, r]) => <button onClick={() => go(r)} key={x}>{x}</button>)}</div><div><h3>Stay Connected</h3><p>{subscribed ? "Thank you. Subscription delivery requires backend connection." : "New devotional works and thoughtful collections, shared with care."}</p><form className="footer-email" onSubmit={e => { e.preventDefault(); setSubscribed(true) }}><input required type="email" aria-label="Email address" placeholder="Your email address" /><button aria-label="Subscribe" type="submit"><Icon name={subscribed ? "check" : "arrow"} /></button></form></div></div><div className="container footer-bottom"><span>© 2025 ZIKR-E-ILAHI. All rights reserved.</span><span>Privacy and terms pages will be published before launch.</span></div></footer>;
}

export default function App() {
  const initial = window.location.hash.slice(1) || "home";
  const [route, setRoute] = useState<Route>(initial);
  const [isLoggedIn, setIsLoggedIn] = useState(() => window.localStorage.getItem("zikr-authenticated") === "true");
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState(() => readPendingAction());

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.hash.slice(1) || "home");
    const syncAuth = () => setIsLoggedIn(window.localStorage.getItem("zikr-authenticated") === "true");
    const handleSelectAudio = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id) setActiveAudioId(detail.id);
    };

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("zikr-auth-state", syncAuth);
    window.addEventListener("zikr-select-audio", handleSelectAudio as EventListener);

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("zikr-auth-state", syncAuth);
      window.removeEventListener("zikr-select-audio", handleSelectAudio as EventListener);
    };
  }, []);

  const go = (r: Route) => {
    const currentPath = route.split("?")[0];
    const nextPath = r.split("?")[0];
    setRoute(r);
    window.location.hash = r;
    if (!lyricsRoutePaths.includes(currentPath) || !lyricsRoutePaths.includes(nextPath)) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeAudio = useMemo(() => (activeAudioId ? getAudioById(activeAudioId) : null), [activeAudioId]);

  const requireAuthentication = (action: string, contentType: string, contentId: string) => {
    if (isLoggedIn) return true;
    const intent = createPendingAction({ action, contentType, contentId, returnTo: window.location.hash || "#home" });
    if (!intent || !savePendingAction(intent)) {
      window.alert("This action could not be saved for return after sign-in. Please retry from the content page.");
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
        window.alert("This audio download is no longer available.");
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
        window.alert("This PDF is no longer available or authorized for download.");
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
        window.alert("This Quran bookmark reference is unavailable.");
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
        window.alert("Bookmarks could not be saved in this browser.");
      }
      return;
    }

    window.alert("Account saving is unavailable because this project has no saved-items service.");
  };

  const handlePlayAudio = (track: (typeof audioLibrary)[number]) => {
    if (!track || !track.source) return;
    setActiveAudioId(track.id);
  };

  const handleDownloadAudio = (track: (typeof audioLibrary)[number]) => {
    if (!track || !requireAuthentication("download-audio", "audio", track.id)) return;
    if (!track.downloadable || track.isDemo || !isAvailableDownloadUrl(track.downloadUrl)) {
      window.alert("This audio file is not available for download.");
      return;
    }
    const opened = window.open(track.downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.alert("The browser blocked the download window. Allow pop-ups and retry.");
  };

  const handleDownloadBook = (book: (typeof ebookLibrary)[number]) => {
    if (!book || !requireAuthentication("download-book", "book", book.id)) return;
    if (!book.downloadable || !isAvailableDownloadUrl(book.downloadUrl)) {
      window.alert("This PDF is unavailable or not authorized for download.");
      return;
    }
    const opened = window.open(book.downloadUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.alert("The browser blocked the download window. Allow pop-ups and retry.");
  };

  const page = useMemo(() => {
    const nextRoute = route.split("?")[0];
    switch (nextRoute) {
      case "lyrics":
      case "lyrics-category":
      case "lyrics-artists":
      case "lyrics-poets":
      case "lyrics-books":
      case "lyrics-languages":
      case "lyrics-subjects": return <LyricsPage go={go} route={route} />;
      case "lyric-detail": return <LyricDetail go={go} />;
      case "quran": return <QuranHome go={go} />;
      case "surahs": return <SurahDirectory go={go} />;
      case "surah-read": return <SurahRead go={go} isLoggedIn={isLoggedIn} onRequireAuthentication={requireAuthentication} />;
      case "para": return <ParaPage go={go} />;
      case "quran-topics": return <QuranTopics go={go} />;
      case "audio": return <AudioPage go={go} onPlayAudio={handlePlayAudio} onDownloadAudio={handleDownloadAudio} activeAudioId={activeAudioId} />;
      case "audio-detail": return <AudioDetail go={go} onPlayAudio={handlePlayAudio} onDownloadAudio={handleDownloadAudio} activeAudioId={activeAudioId} />;
      case "services": return <Services go={go} />;
      case "ebooks": return <Ebooks go={go} onDownloadBook={handleDownloadBook} />;
      case "book-detail": return <BookDetail go={go} isLoggedIn={isLoggedIn} onDownloadBook={handleDownloadBook} />;
      case "book-reader": return <BookReader go={go} />;
      case "about": return <About go={go} />;
      case "contact": return <Contact go={go} />;
      case "login": return <Auth mode="login" go={go} />;
      case "register": return <Auth mode="register" go={go} />;
      case "admin": return <Admin go={go} />;
      case "admin-edit": return <Admin edit go={go} />;
      default: return <Home go={go} onPlayAudio={handlePlayAudio} onDownloadAudio={handleDownloadAudio} activeAudioId={activeAudioId} />;
    }
  }, [activeAudioId, go, isLoggedIn, route]);

  const routePath = route.split("?")[0];
  const standalone = ["login", "register", "admin", "admin-edit", "book-reader"].includes(routePath);
  const headerRoute = lyricsRoutePaths.includes(routePath) ? "lyrics" : routePath;
  return <div>{!standalone && <Header route={headerRoute} go={go} />}{isLoggedIn && pendingAction && !["login", "register"].includes(routePath) && <PendingActionNotice pendingAction={pendingAction} action={pendingAction.action} onContinue={resumePendingAction} onDismiss={dismissPendingAction} />}{page}{!standalone && <Footer go={go} />}{activeAudio && <PersistentAudioPlayer track={activeAudio} onClose={() => setActiveAudioId(null)} />}</div>;
}
