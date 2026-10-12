import { useEffect, useMemo, useRef, useState } from "react";

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

const lyrics = [
  { title: "Mustafa Jaan-e", artist: "Owais Raza Qadri", writer: "Imam Ahmed Raza Khan", category: "Durood-o-Salam", language: "Urdu", date: "12 May 2025", image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=1200&q=82" },
  { title: "Karam Mangta Hoon", artist: "Owais Raza Qadri", writer: "Muzaffar Warsi", category: "Naat Sharif", language: "Urdu", date: "08 May 2025", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=82" },
  { title: "Main So Jaun ", artist: "Zohaib Ashrafi", writer: "Traditional", category: "Naat Sharif", language: "Urdu", date: "02 May 2025", image: "https://images.unsplash.com/photo-1567712595315-545da0d341b2?auto=format&fit=crop&w=1200&q=82" },
  { title: "Kabe Ki Ronaq", artist: "Owais Raza Qadri", writer: "Traditional", category: "Hamd", language: "Hindi", date: "28 Apr 2025", image: "https://images.unsplash.com/photo-1596612265825-f7d7506ae4ad?auto=format&fit=crop&w=1200&q=82" },
  { title: "Mere Aaqa Aao", artist: "Zohaib Ashrafi", writer: "Pir Nasiruddin Nasir", category: "Naat Sharif", language: "Urdu", date: "20 Apr 2025", image: "https://images.unsplash.com/photo-1554110838-816383ce7956?auto=format&fit=crop&w=1200&q=82" },
  { title: "Allah Hu Allah Hu", artist: "Traditional", writer: "Traditional", category: "Sufi Kalam", language: "Persian", date: "14 Apr 2025", image: "https://images.unsplash.com/photo-1533082385145-b152cdde7ccd?auto=format&fit=crop&w=1200&q=82" },
];

const audio = [
  { title: "Karam Mangta Hoon", artist: "Owais Raza Qadri", category: "Naat", duration: "06:24", date: "08 May 2025", color: "green", image: "https://images.unsplash.com/photo-1778754607042-5fc1e79b300f?auto=format&fit=crop&w=900&q=80" },
  { title: "Mustafa Jaan-e-Rehmat", artist: "Zohaib Ashrafi", category: "Durood-o-Salam", duration: "08:42", date: "04 May 2025", color: "gold", image: "https://images.unsplash.com/photo-1537181534458-45dcee76ae90?auto=format&fit=crop&w=900&q=80" },
  { title: "Ya Ilahi Har Jagah", artist: "Zikr Ensemble", category: "Hamd", duration: "05:18", date: "29 Apr 2025", color: "ink", image: "https://images.unsplash.com/photo-1671105424304-5aed79f1156a?auto=format&fit=crop&w=900&q=80" },
];

const books = [
  { title: "Gardens of Devotion", author: "Editorial Collection", category: "Naat Books", date: "10 May 2025", downloadable: false, color: "emerald" },
  { title: "Pathways of Remembrance", author: "Editorial Collection", category: "Islamic Books", date: "01 May 2025", downloadable: true, color: "wine" },
  { title: "Durood & Salam", author: "Compiled Edition", category: "Durood-o-Salam", date: "24 Apr 2025", downloadable: false, color: "navy" },
  { title: "Prayers for Every Day", author: "Editorial Collection", category: "Dua Books", date: "16 Apr 2025", downloadable: true, color: "sand" },
];

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

function Home({ go }: { go: (r: Route) => void }) {
  const heroRef = useReveal<HTMLDivElement>();
  const features = [
    ["pen", "Lyrics", "Naats, Hamd, Manqabat & Sufi Kalam", "lyrics"],
    ["book", "The Holy Quran", "Read Surahs with trusted translations", "quran"],
    ["headphones", "Devotional Audio", "Listen, reflect, and find peace", "audio"],
    ["layers", "E-Books", "A thoughtful Islamic digital library", "ebooks"],
    ["grid", "Creative Services", "Production for devotional creators", "services"],
  ] as const;
  return <main>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(12,12,11,.96) 8%,rgba(12,12,11,.78) 48%,rgba(12,12,11,.38)),url(${photos.hero})` }}>
      <div className="hero-pattern" /><div ref={heroRef} className="container hero-content reveal"><span className="eyebrow">A SANCTUARY FOR THE HEART</span><h1>Find Peace in<br /><em>Remembrance</em> of Allah</h1><p>Explore beautiful Naats, Quranic verses, devotional audio, and Islamic literature in one peaceful place.</p><div className="button-row"><Btn onClick={() => go("lyrics")} icon="arrow">Explore Devotional Content</Btn><Btn onClick={() => go("quran")} variant="ghost">Read the Quran</Btn></div><div className="hero-note"><span>ٱذْكُرُوا ٱللَّهَ</span><i />Remember Allah often</div></div>
    </section>
    <section className="quick container"><div className="feature-grid">{features.map(([icon, title, text, path], i) => <Reveal className="card-reveal" delay={i * 80} key={title}><button className="feature-card" onClick={() => go(path)}><span className="feature-icon"><Icon name={icon} /></span><span><b>{title}</b><small>{text}</small></span><Icon name="arrow" size={18} /></button></Reveal>)}</div></section>
    <section className="section container"><SectionHead eyebrow="Newly Added" title="Latest Lyrics" body="Words of devotion, carefully presented for reflection and recitation." action="View All Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{lyrics.slice(0, 4).map((x, i) => <LyricsCard item={x} key={x.title} index={i} onClick={() => go("lyric-detail")} />)}</div></section>
    <section className="quran-feature"><Reveal className="container quran-feature-inner"><div className="calligraphy"><span>القرآن</span><small>THE HOLY QURAN</small></div><div><span className="eyebrow">READ • REFLECT • UNDERSTAND</span><h2>Reconnect Through<br />the Holy Quran</h2><p>Browse all Surahs and Paras with a serene reading experience and carefully presented translations.</p><div className="mini-links">{["Surah", "Para", "Quranic Topics", "Quranic Quotes"].map(x => <button onClick={() => go(x === "Para" ? "para" : x === "Surah" ? "surahs" : "quran-topics")} key={x}>{x}<Icon name="chevron" size={14} /></button>)}</div><Btn onClick={() => go("quran")} icon="arrow">Explore Quran</Btn></div></Reveal></section>
    <section className="section dark-section"><div className="container"><SectionHead eyebrow="Listen & Reflect" title="Latest Devotional Audio" body="Soulful recitations and timeless words of devotion." action="View All Audio" onAction={() => go("audio")} /><div className="audio-grid">{audio.map((x, i) => <AudioCard key={x.title} item={x} index={i} onClick={() => go("audio-detail")} />)}</div></div></section>
    <section className="section container"><SectionHead eyebrow="Knowledge for the Soul" title="Featured E-Books" body="Discover a curated library of Islamic literature." action="Explore E-Books" onAction={() => go("ebooks")} /><div className="book-grid">{books.map((x, i) => <BookCard item={x} key={x.title} index={i} onClick={() => go("book-detail")} />)}</div></section>
    <section className="service-preview"><div className="container service-preview-grid"><div><span className="eyebrow">Creative Studio</span><h2>Devotional content,<br /><em>beautifully crafted.</em></h2><p>From pristine audio to thoughtful visuals, we help creators share their message with clarity and care.</p><Btn onClick={() => go("services")} icon="arrow">View Our Services</Btn></div><div className="service-list">{["Naat Mixing & Mastering", "Video Editing", "Thumbnails & Posters", "Audio Distribution", "YouTube Management"].map((x, i) => <button key={x} onClick={() => go("services")}><span>0{i + 1}</span><b>{x}</b><Icon name="arrow" /></button>)}</div></div></section>
    <section className="closing"><div className="ornament">✦</div><span className="eyebrow">BEGIN YOUR JOURNEY</span><h2>Let every word bring<br />your heart closer.</h2><p>Explore a peaceful collection made for remembrance and reflection.</p><Btn onClick={() => go("lyrics")} icon="arrow">Discover Zikr-e-Ilahi</Btn></section>
  </main>;
}

function LyricsCard({ item, index, onClick }: { item: typeof lyrics[0]; index: number; onClick: () => void }) {
  const ref = useReveal<HTMLElement>((index % 4) * 85);
  return <article ref={ref} className="lyric-card editorial-lyric reveal" onClick={onClick} tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}><img src={item.image} alt="" loading="lazy" /><span className="lyric-overlay" /><div className="lyric-content"><div className="lyric-top"><span className="editorial-label">{item.category} • {item.language}</span><span>{item.date}</span></div><div className="lyric-bottom"><h3>{item.title}</h3><p>Recited by <b>{item.artist}</b></p><small>Written by {item.writer}</small><button className="editorial-action" aria-label={`Read ${item.title}`}>Read Lyrics <Icon name="arrow" /></button></div></div></article>;
}

function AudioCard({ item, index, onClick }: { item: typeof audio[0]; index: number; onClick: () => void }) {
  const [playing, setPlaying] = useState(false);
  const ref = useReveal<HTMLElement>((index % 4) * 85);
  return <article ref={ref} className="audio-card reveal"><div className={`audio-art ${item.color}`}><img src={item.image} alt="" loading="lazy" /><span className="media-overlay" /><div className="arch-art"><span>ذِكْر</span></div><button className="play-btn" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>{playing ? <span className="pause">Ⅱ</span> : <Icon name="play" />}</button></div><div className="audio-info"><span className="badge">{item.category}</span><h3><button className="card-title-link" onClick={onClick}>{item.title}</button></h3><p>{item.artist}</p><div className="media-meta"><span>{item.date}</span><span>{playing ? "Playing" : item.duration}</span></div></div></article>;
}

function BookCard({ item, index, onClick }: { item: typeof books[0]; index: number; onClick: () => void }) {
  const ref = useReveal<HTMLElement>((index % 4) * 85);
  return <article ref={ref} className="book-card reveal"><button className={`book-cover ${item.color}`} onClick={onClick}><span className="cover-ornament">۞</span><small>ZIKR-E-ILAHI LIBRARY</small><b>{item.title}</b><i>Volume {index + 1}</i></button><span className="badge">{item.category}</span><h3>{item.title}</h3><p>{item.author} <span aria-hidden="true">•</span> {item.date}</p><div className="book-actions"><Btn variant="outline" icon="book" onClick={onClick}>Read Online</Btn><Btn variant="outline" icon="download" disabled={!item.downloadable}>{item.downloadable ? "Download PDF" : "Restricted"}</Btn></div></article>;
}

function DirectoryHeader({ go, title, text }: { go: (r: Route) => void; title: string; text: string }) {
  return <><div className="cream-top"><div className="container"><Breadcrumbs items={[title]} go={go} /><span className="eyebrow">ZIKR-E-ILAHI LIBRARY</span><h1>{title}</h1><p>{text}</p></div></div></>;
}

function LyricsPage({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All Lyrics");
  const [letter, setLetter] = useState("All");
  const tabs = ["All Lyrics", "Categories", "Naatkhawan", "Writers / Poets", "Language", "Books", "Subject / Occasion", "Collections", "Request Lyrics"];
  const filtered = lyrics.filter(x => (!search || `${x.title} ${x.artist} ${x.writer}`.toLowerCase().includes(search.toLowerCase())) && (letter === "All" || (letter === "0" ? /^\d/.test(x.title) : x.title.startsWith(letter))));
  return <main><DirectoryHeader go={go} title="Devotional Lyrics" text="Discover words of praise and devotion across languages, traditions, and beloved voices." /><div className="container directory-controls"><SearchBox value={search} setValue={setSearch} /><Tabs items={tabs} active={tab} setActive={setTab} /><div className="alphabet"><button className={letter === "All" ? "active" : ""} onClick={() => setLetter("All")}>All</button><button onClick={() => setLetter("0")}>0–9</button>{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(x => <button className={letter === x ? "active" : ""} key={x} onClick={() => setLetter(x)}>{x}</button>)}</div></div><section className="section container"><SectionHead eyebrow={`${filtered.length} works`} title={tab === "All Lyrics" ? "Recently Published" : tab} />{filtered.length ? <div className="lyrics-list">{filtered.map((x, i) => <LyricsCard item={x} index={i} key={x.title} onClick={() => go("lyric-detail")} />)}</div> : <div className="empty"><Icon name="search" size={32} /><h3>No lyrics found</h3><p>Try a different search term or letter.</p></div>}<div className="pagination"><button className="active">1</button><button>2</button><button>3</button><button><Icon name="arrow" size={16} /></button></div></section></main>;
}

function LyricDetail({ go }: { go: (r: Route) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText("Prototype lyrics content"); setCopied(true); setTimeout(() => setCopied(false), 1500) };
  return <main className="reading-bg"><div className="container narrow"><Breadcrumbs items={["Lyrics", "Mustafa Jaan-e-Rehmat"]} go={go} /><article className="lyric-reading"><span className="badge">Durood-o-Salam</span><h1>Mustafa Jaan-e-Rehmat Pe Lakhon Salam</h1><p className="lead">A timeless expression of love and reverence.</p><div className="detail-meta"><span><small>RECITED BY</small>Owais Raza Qadri</span><span><small>WRITTEN BY</small>Imam Ahmed Raza Khan</span><span><small>LANGUAGE</small>Urdu</span></div><div className="reader-tools"><select aria-label="Script"><option>Roman Urdu</option><option>Urdu Script</option><option>Hindi</option></select><div><Btn variant="outline" icon={copied ? "check" : "copy"} onClick={copy}>{copied ? "Copied" : "Copy Lyrics"}</Btn><Btn variant="outline" icon="share" onClick={() => navigator.share?.({ title: "Mustafa Jaan-e-Rehmat" })}>Share</Btn></div></div><div className="lyrics-text"><p>Mustafa jaan-e-rehmat pe lakhon salam<br />Sham-e bazm-e hidayat pe lakhon salam</p><p>Meher-e charkh-e nubuwwat pe roshan durood<br />Gul-e bagh-e risalat pe lakhon salam</p><aside>Prototype excerpt for layout demonstration. Full lyrics should be verified and attributed before publication.</aside></div></article><section className="related"><SectionHead title="Related Lyrics" action="Back to Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{lyrics.slice(1, 3).map((x, i) => <LyricsCard item={x} index={i} key={x.title} onClick={() => go("lyric-detail")} />)}</div></section></div></main>;
}

function QuranTabs({ go, active }: { go: (r: Route) => void; active: string }) {
  const map: Record<string, string> = { "Quran Home": "quran", "Surah": "surahs", "Para": "para", "Makki / Madani": "surahs", "Topics": "quran-topics", "Quranic Quotes": "quran-topics", "Audio": "audio", "Search": "quran" };
  return <div className="quran-nav container">{Object.keys(map).map(x => <button className={x === active ? "active" : ""} key={x} onClick={() => go(map[x])}>{x}</button>)}</div>;
}

function QuranHome({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  return <main><PageHero eyebrow="THE HOLY QURAN" title="Read. Reflect. Return." text="A calm and respectful space to explore the Quran, Surah by Surah."><SearchBox value={search} setValue={setSearch} placeholder="Search Surah by name or number..." /></PageHero><QuranTabs go={go} active="Quran Home" /><section className="section container"><div className="browse-cards"><button onClick={() => go("surahs")}><span>114</span><div><b>Browse by Surah</b><small>Explore every chapter in order</small></div><Icon name="arrow" /></button><button onClick={() => go("para")}><span>30</span><div><b>Browse by Para</b><small>Read by Juz division</small></div><Icon name="arrow" /></button></div><SectionHead eyebrow="Continue Exploring" title="Surahs of the Quran" action="View all 114 Surahs" onAction={() => go("surahs")} /><SurahGrid go={go} items={surahs.slice(0, 6)} /></section></main>;
}

function SurahGrid({ go, items = surahs }: { go: (r: Route) => void; items?: string[][] }) {
  return <div className="surah-grid">{items.map(x => <button key={x[0]} onClick={() => go("surah-read")}><span className="surah-no">{x[0]}</span><div><b>{x[2]}</b><small>{x[3]} • {x[4]}</small></div><strong lang="ar" dir="rtl">{x[1]}</strong></button>)}</div>;
}

function SurahDirectory({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState("");
  const shown = surahs.filter(x => x.join(" ").toLowerCase().includes(search.toLowerCase()));
  return <main><DirectoryHeader go={go} title="Surah Directory" text="Browse all 114 Surahs of the Holy Quran in their established order." /><QuranTabs go={go} active="Surah" /><section className="section container"><SearchBox value={search} setValue={setSearch} placeholder="Find a Surah by name or number" /><div className="directory-summary"><span>{shown.length} Surahs</span><small>Ordered from Al-Fatihah to An-Nas</small></div><SurahGrid go={go} items={shown} /></section></main>;
}

function SurahRead({ go }: { go: (r: Route) => void }) {
  const [lang, setLang] = useState("English");
  const [transliteration, setTransliteration] = useState(false);
  const translations: Record<string, string> = { English: "In the name of Allah, the Most Compassionate, the Most Merciful.", Urdu: "اللہ کے نام سے جو نہایت مہربان، رحم فرمانے والا ہے۔", Hindi: "अल्लाह के नाम से जो अत्यन्त कृपाशील तथा दयावान् है।" };
  return <main className="reading-bg"><QuranTabs go={go} active="Surah" /><div className="container narrow"><Breadcrumbs items={["Quran", "Surah", "Al-Fatihah"]} go={go} /><section className="surah-header"><span>01</span><div><small>THE OPENING</small><h1>Al-Fatihah</h1><p>Makki • 7 Ayat</p></div><strong dir="rtl" lang="ar">الفاتحة</strong></section><div className="reader-tools quran-tools"><div className="segmented">{["English", "Urdu", "Hindi"].map(x => <button className={lang === x ? "active" : ""} onClick={() => setLang(x)} key={x}>{x}</button>)}</div><label className="toggle-control"><input type="checkbox" checked={transliteration} onChange={e => setTransliteration(e.target.checked)} /><span>Transliteration</span></label><Btn variant="outline" icon="headphones">Listen</Btn></div><div className="ayah"><div className="ayah-top"><span>1:1</span><button aria-label="Play ayah"><Icon name="play" /></button><button aria-label="Bookmark"><Icon name="heart" /></button></div><p className="arabic" dir="rtl" lang="ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>{transliteration && <p className="transliteration">Bismillāhir-Raḥmānir-Raḥīm</p>}<p className={`translation ${lang === "Urdu" ? "urdu" : ""}`} dir={lang === "Urdu" ? "rtl" : "ltr"}>{translations[lang]}</p><small>Verified sample: Surah Al-Fatihah 1:1. Translation shown for prototype demonstration.</small></div><div className="sample-boundary"><Icon name="book" /><p>This prototype intentionally shows one verified Ayat sample. The production reader will render all Ayat individually from an authoritative Quran data source with translation attribution.</p></div><div className="surah-pager"><button disabled>← Previous Surah</button><button onClick={() => go("surahs")}>All Surahs</button><button onClick={() => go("surahs")}>Next Surah →</button></div></div></main>;
}

function ParaPage({ go }: { go: (r: Route) => void }) {
  return <main><DirectoryHeader go={go} title="Para Directory" text="Browse the Holy Quran through its 30 traditional Juz divisions." /><QuranTabs go={go} active="Para" /><section className="section container"><div className="para-grid">{Array.from({ length: 30 }, (_, i) => <button key={i} onClick={() => go("surah-read")}><span>{String(i + 1).padStart(2, "0")}</span><div><b>Para {i + 1}</b><small>Juz {i + 1}</small></div><Icon name="chevron" /></button>)}</div></section></main>;
}

function QuranTopics({ go }: { go: (r: Route) => void }) {
  return <main><DirectoryHeader go={go} title="Quranic Topics & Quotes" text="Explore an editorial index designed to guide thoughtful study. Published content must use verified source text and attribution." /><QuranTabs go={go} active="Topics" /><section className="section container"><div className="topic-grid">{["Patience & Perseverance", "Mercy & Forgiveness", "Gratitude", "Prayer & Remembrance", "Family & Community", "Knowledge & Reflection"].map((x, i) => <button key={x}><span>0{i + 1}</span><b>{x}</b><small>Curated references</small><Icon name="arrow" /></button>)}</div><div className="notice"><Icon name="book" /><div><b>Respectful by design</b><p>Quranic quotations will only be displayed after verification against authoritative source data and translation attribution.</p></div></div></section></main>;
}

function AudioPage({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState(""); const [tab, setTab] = useState("All Audio");
  const cats = ["All Audio", "Naat", "Manqabat", "Hamd", "Durood-o-Salam", "Sufi Kalam", "Qawwali", "Nasheed", "Dua", "Quran Audio"];
  const shown = audio.filter(x => (tab === "All Audio" || x.category.includes(tab)) && x.title.toLowerCase().includes(search.toLowerCase()));
  return <main><DirectoryHeader go={go} title="Devotional Audio" text="Listen to soulful recitations, Naats, Hamd, and timeless devotional works." /><div className="container directory-controls"><SearchBox value={search} setValue={setSearch} placeholder="Search audio or artist" /><Tabs items={cats} active={tab} setActive={setTab} /></div><section className="section container"><SectionHead eyebrow="Newest first" title="Latest Audio" /><div className="audio-grid light">{shown.map((x, i) => <AudioCard key={x.title} item={x} index={i} onClick={() => go("audio-detail")} />)}</div></section></main>;
}

function AudioDetail({ go }: { go: (r: Route) => void }) {
  const [playing, setPlaying] = useState(false);
  return <main className="reading-bg"><div className="container"><Breadcrumbs items={["Audio", "Karam Mangta Hoon"]} go={go} /><div className="audio-detail"><div className="audio-art green large"><div className="arch-art"><span>ذِكْر</span></div></div><div><span className="badge">Naat</span><h1>Karam Mangta Hoon</h1><p className="lead">Recited by Owais Raza Qadri</p><div className="detail-meta"><span><small>PUBLISHED</small>08 May 2025</span><span><small>DURATION</small>06:24</span></div><div className="player"><button className="play-main" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause audio" : "Play audio"}>{playing ? <span>Ⅱ</span> : <Icon name="play" size={24} />}</button><span>0:00</span><input type="range" min="0" max="100" defaultValue="28" aria-label="Audio progress" /><span>6:24</span><Icon name="volume" /></div><p className="prototype-note">Player interaction is demonstrated visually. Connect a valid licensed audio source for playback.</p><div className="button-row"><Btn variant="outline" icon="share" onClick={() => navigator.share?.({ title: "Karam Mangta Hoon" })}>Share</Btn><Btn variant="outline" icon="heart">Save</Btn></div></div></div><section className="related"><SectionHead title="Related Lyrics" action="Read All Lyrics" onAction={() => go("lyrics")} /><div className="lyrics-grid">{lyrics.slice(0, 2).map((x, i) => <LyricsCard item={x} index={i} key={x.title} onClick={() => go("lyric-detail")} />)}</div></section><section className="related"><SectionHead title="Related Audio" action="View All Audio" onAction={() => go("audio")} /><div className="audio-grid light">{audio.slice(1).map((x, i) => <AudioCard key={x.title} item={x} index={i} onClick={() => go("audio-detail")} />)}</div></section></div></main>;
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

function Ebooks({ go }: { go: (r: Route) => void }) {
  const [search, setSearch] = useState(""); const [tab, setTab] = useState("Islamic Books");
  const filteredBooks = books.filter(x => x.title.toLowerCase().includes(search.toLowerCase()) && (tab === "Islamic Books" || x.category === tab || (tab === "Free E-Books" && x.downloadable)));
  return <main><DirectoryHeader go={go} title="Islamic E-Books Library" text="A considered collection of devotional literature for reading, reflection, and learning." /><div className="container directory-controls"><SearchBox value={search} setValue={setSearch} placeholder="Search books or authors" /><Tabs items={["Islamic Books", "Naat Books", "Ala Hazrat Books", "Durood-o-Salam", "Dua Books", "Free E-Books"]} active={tab} setActive={setTab} /></div><section className="section container"><SectionHead eyebrow={`${filteredBooks.length} books • newest first`} title="Latest Uploads" />{filteredBooks.length ? <div className="book-grid">{filteredBooks.map((x, i) => <BookCard item={x} index={i} key={x.title} onClick={() => go("book-detail")} />)}</div> : <div className="empty"><Icon name="book" size={32} /><h3>No books in this prototype category yet</h3><p>New verified and permitted titles will appear here.</p></div>}</section></main>;
}

function BookDetail({ go }: { go: (r: Route) => void }) {
  return <main className="reading-bg"><div className="container"><Breadcrumbs items={["E-Books", "Gardens of Devotion"]} go={go} /><div className="book-detail"><div className="book-cover emerald large-cover"><span className="cover-ornament">۞</span><small>ZIKR-E-ILAHI LIBRARY</small><b>Gardens of Devotion</b><i>Curated Edition</i></div><div><span className="badge">Naat Books</span><h1>Gardens of Devotion</h1><p className="lead">Editorial Collection</p><div className="detail-meta"><span><small>LANGUAGE</small>English & Urdu</span><span><small>FORMAT</small>Digital Edition</span><span><small>ACCESS</small>Read online</span></div><h3>About this book</h3><p>A prototype description for a curated devotional collection. Publication details, authorship, copyright, and distribution permissions must be confirmed before release.</p><div className="button-row"><Btn onClick={() => go("book-reader")} icon="book">Read Online</Btn><Btn variant="outline" icon="download" disabled>Download unavailable</Btn></div></div></div><section className="related"><SectionHead title="Related Books" /><div className="book-grid">{books.slice(1, 4).map((x, i) => <BookCard item={x} index={i} key={x.title} onClick={() => go("book-detail")} />)}</div></section></div></main>;
}

function BookReader({ go }: { go: (r: Route) => void }) {
  const [page, setPage] = useState(1); const [zoom, setZoom] = useState(100);
  return <main className="book-reader"><div className="reader-bar"><button onClick={() => go("book-detail")}>← Return to book</button><b>Gardens of Devotion</b><div><button onClick={() => setZoom(Math.max(70, zoom - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))}>+</button><button aria-label="Full screen">⛶</button></div></div><div className="document" style={{ transform: `scale(${zoom / 100})` }}><small>ZIKR-E-ILAHI LIBRARY</small><h1>Gardens of Devotion</h1><div className="doc-ornament">۞</div><p>This reader is a realistic prototype interface. Connect a permitted PDF or document source during backend implementation.</p><span>Sample page {page}</span></div><div className="page-controls"><button onClick={() => setPage(Math.max(1, page - 1))}>← Previous</button><span>Page {page} of 48</span><button onClick={() => setPage(Math.min(48, page + 1))}>Next →</button></div></main>;
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
  const [error, setError] = useState(""); const [show, setShow] = useState(false);
  return <main className="auth-page"><div className="auth-panel"><button onClick={() => go("home")} className="auth-logo"><Logo /></button><span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}</span><h1>{mode === "login" ? "Sign in to your account" : "Create your account"}</h1><p>{mode === "login" ? "A peaceful place to continue your journey." : "Begin your personal journey with Zikr-e-Ilahi."}</p><form onSubmit={e => { e.preventDefault(); setError("Prototype only — connect authentication to continue.") }}>{mode === "register" && <FormField label="Full Name" name="name" />}<FormField label={mode === "login" ? "Email or Username" : "Email"} name="email" type="email" /><label className="field"><span>Password</span><div className="password"><input name="password" type={show ? "text" : "password"} placeholder="Enter your password" /><button type="button" onClick={() => setShow(!show)}><Icon name="eye" /></button></div></label>{mode === "register" && <FormField label="Confirm Password" name="confirm" type="password" />}<label className="checkbox"><input type="checkbox" /><span>{mode === "login" ? "Remember me" : "I accept the Terms and Privacy Policy"}</span></label>{error && <p className="error">{error}</p>}<Btn type="submit">{mode === "login" ? "Sign In" : "Create Account"}</Btn></form><div className="auth-switch">{mode === "login" ? "New to Zikr-e-Ilahi?" : "Already have an account?"}<button onClick={() => go(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></div></div><div className="auth-image" style={{ backgroundImage: `linear-gradient(rgba(15,15,14,.3),rgba(15,15,14,.78)),url(${photos.minaret})` }}><blockquote>“In the remembrance of Allah do hearts find rest.”<small>QURAN 13:28</small></blockquote></div></main>;
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
  const go = (r: Route) => { setRoute(r); window.location.hash = r; window.scrollTo({ top: 0, behavior: "smooth" }) };
  const page = useMemo(() => {
    switch (route) {
      case "lyrics": return <LyricsPage go={go} />;
      case "lyric-detail": return <LyricDetail go={go} />;
      case "quran": return <QuranHome go={go} />;
      case "surahs": return <SurahDirectory go={go} />;
      case "surah-read": return <SurahRead go={go} />;
      case "para": return <ParaPage go={go} />;
      case "quran-topics": return <QuranTopics go={go} />;
      case "audio": return <AudioPage go={go} />;
      case "audio-detail": return <AudioDetail go={go} />;
      case "services": return <Services go={go} />;
      case "ebooks": return <Ebooks go={go} />;
      case "book-detail": return <BookDetail go={go} />;
      case "book-reader": return <BookReader go={go} />;
      case "about": return <About go={go} />;
      case "contact": return <Contact go={go} />;
      case "login": return <Auth mode="login" go={go} />;
      case "register": return <Auth mode="register" go={go} />;
      case "admin": return <Admin go={go} />;
      case "admin-edit": return <Admin edit go={go} />;
      default: return <Home go={go} />;
    }
  }, [route]);
  const standalone = ["login", "register", "admin", "admin-edit", "book-reader"].includes(route);
  return <div>{!standalone && <Header route={route} go={go} />} {page} {!standalone && <Footer go={go} />}</div>;
}
