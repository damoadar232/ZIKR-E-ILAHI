import { useEffect, useState } from "react";
import { interfaceAttributeText, LocalizedText, useInterfaceText } from "../../../app/providers/interfaceLanguage";
import { Btn, Icon, Logo } from "../../../components/ui";

function AdminFormField({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
    const t = useInterfaceText();
    return <label className="field"><span>{t(label)}</span><input name={name} type={type} placeholder={t(placeholder || `Enter your ${label.toLowerCase()}`)} /></label>;
}

function AdminDashboard({ go }: { go: (route: string) => void }) {
    const t = useInterfaceText();
    return <><div className="stat-grid">{[["1,248", "Published Lyrics"], ["186", "Audio Items"], ["94", "E-Books"], ["12", "Pending Content"]].map(([n, l]) => <article key={t(l)}><span>{n}</span><small>{t(l)}</small></article>)}</div><section className="admin-table"><div className="section-head"><div><h2><LocalizedText text={"Recent uploads"} /></h2><p><LocalizedText text={"Latest activity across the library"} /></p></div><Btn onClick={() => go("admin-edit")}><LocalizedText text={"Add Content"} /></Btn></div><div className="table-head"><span><LocalizedText text={"Content"} /></span><span><LocalizedText text={"Type"} /></span><span><LocalizedText text={"Status"} /></span><span><LocalizedText text={"Published"} /></span></div>{[["Mustafa Jaan-e-Rehmat", "Lyrics", "Published", "12 May 2025"], ["Karam Mangta Hoon", "Audio", "Published", "08 May 2025"], ["Gardens of Devotion", "E-Book", "Draft", "—"], ["Mere Aaqa Aao", "Lyrics", "Review", "02 May 2025"]].map((row) => <button key={row[0]} onClick={() => go("admin-edit")}>{row.map((x, i) => <span key={x} className={i === 2 ? `status ${x.toLowerCase()}` : ""}>{i === 1 || i === 2 ? t(x) : x}</span>)}</button>)}</section></>;
}

export function AdminPage({ edit = false, go }: { edit?: boolean; go: (route: string) => void }) {
    const t = useInterfaceText();
    const [preview, setPreview] = useState(false);
    const [editorOpen, setEditorOpen] = useState(edit);
    const [activeSection, setActiveSection] = useState("Lyrics");

    useEffect(() => {
        setEditorOpen(edit);
    }, [edit]);

    const nav = ["Dashboard", "Lyrics", "Quran Content", "Audio", "E-Books", "Services", "Portfolio", "Categories", "Authors / Artists", "Contact Enquiries", "Settings"];

    return <main className="admin"><aside><Logo /><small><LocalizedText text={"CONTENT ADMIN"} /></small>{nav.map((x, i) => <button className={(editorOpen && x === activeSection) || (!editorOpen && i === 0) ? "active" : ""} key={x} onClick={() => { setActiveSection(x); setEditorOpen(i !== 0); }}><Icon name={i === 0 ? "grid" : i === 1 ? "pen" : i === 3 ? "headphones" : i === 4 ? "book" : "layers"} size={17} />{t(x)}</button>)}</aside><div className="admin-main"><header><div><small><LocalizedText text={"ADMINISTRATION"} /></small><h1>{editorOpen ? `${t(activeSection)} ${t("Management")}` : t("Good morning, Editor")}</h1></div><div className="admin-user"><LocalizedText text={"ZE"} /></div></header>{editorOpen ? <><div className="admin-actions"><button onClick={() => setEditorOpen(false)}><LocalizedText text={"← Dashboard"} /></button><div><Btn variant="outline" onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</Btn><Btn><LocalizedText text={"Save Draft"} /></Btn></div></div>{preview ? <article className="admin-preview"><span className="badge"><LocalizedText text={"Draft preview"} /></span><h1><LocalizedText text={"Mustafa Jaan-e-Rehmat Pe Lakhon Salam"} /></h1><p><LocalizedText text={"Lyrics preview appears here as editors type and format content."} /></p></article> : <form className="editor-form"><div className="form-card"><h2><LocalizedText text={"Content details"} /></h2><p className="form-help"><LocalizedText text={"Create, edit, preview, publish, or archive library content. Fields adapt to the selected content type during backend integration."} /></p><div className="two-fields"><label className="field"><span><LocalizedText text={"Content type"} /></span><select><option>{t("Lyrics")}</option><option>{t("Audio")}</option><option>{t("E-Book")}</option><option>{t("Service")}</option><option>{t("Portfolio")}</option></select></label><AdminFormField label="Publish Date" name="date" type="date" /></div><AdminFormField label="Title" name="title" /><div className="two-fields"><AdminFormField label="Author / Artist" name="author" /><AdminFormField label="Category" name="category" /></div><label className="field"><span><LocalizedText text={"Summary"} /></span><textarea name="summary" rows={4} /></label><label className="field"><span><LocalizedText text={"Body"} /></span><textarea name="body" rows={10} /></label></div></form>}</> : <AdminDashboard go={go} />}</div></main>;
}
