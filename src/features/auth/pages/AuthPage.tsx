import { useState } from "react";
import { LocalizedText, useInterfaceLanguage, useInterfaceText } from "../../../app/providers/interfaceLanguage";
import { photos } from "../../../app/config/media";
import { readPendingAction, safeReturnTo } from "../../../authActions.js";
import { Btn, Icon, Logo } from "../../../components/ui";

function AuthFormField({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
    const t = useInterfaceText();
    return <label className="field"><span>{t(label)}</span><input name={name} type={type} placeholder={t(placeholder || `Enter your ${label.toLowerCase()}`)} /></label>;
}

export function AuthPage({ mode, go }: { mode: "login" | "register"; go: (route: string) => void }) {
    const t = useInterfaceText();
    const language = useInterfaceLanguage();
    const [error, setError] = useState("");
    const [show, setShow] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const pendingAction = readPendingAction();
        const returnTo = pendingAction ? safeReturnTo(pendingAction.returnTo, pendingAction.action) : null;
        window.localStorage.setItem("zikr-authenticated", "true");
        window.dispatchEvent(new Event("zikr-auth-state"));
        go((returnTo || "#home").slice(1));
    };

    return <main className="auth-page" lang={language} dir={language === "ur" ? "rtl" : "ltr"}><div className="auth-panel"><button onClick={() => go("home")} className="auth-logo"><Logo /></button><span className="eyebrow">{t(mode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY")}</span><h1>{t(mode === "login" ? "Sign in to your account" : "Create your account")}</h1><p>{t(mode === "login" ? "A peaceful place to continue your journey." : "Begin your personal journey with Zikr-e-Ilahi.")}</p><form onSubmit={handleSubmit}>{mode === "register" && <AuthFormField label="Full Name" name="name" />}<AuthFormField label={mode === "login" ? "Email or Username" : "Email"} name="email" type="email" /><label className="field"><span>{t("Password")}</span><div className="password"><input name="password" type={show ? "text" : "password"} placeholder={t("Enter your password")} /><button type="button" onClick={() => setShow(!show)} aria-label={t(show ? "Hide password" : "Show password")}><Icon name="eye" /></button></div></label>{mode === "register" && <AuthFormField label="Confirm Password" name="confirm" type="password" />}<label className="checkbox"><input type="checkbox" /><span>{t(mode === "login" ? "Remember me" : "I accept the Terms and Privacy Policy")}</span></label>{error && <p className="error">{t(error)}</p>}<Btn type="submit">{mode === "login" ? "Sign In" : "Create Account"}</Btn></form><div className="auth-switch"><LocalizedText text={mode === "login" ? "New to Zikr-e-Ilahi?" : "Already have an account?"} /><button onClick={() => go(mode === "login" ? "register" : "login")}>{t(mode === "login" ? "Create account" : "Sign in")}</button></div></div><div className="auth-image" style={{ backgroundImage: `linear-gradient(rgba(15,15,14,.3),rgba(15,15,14,.78)),url(${photos.minaret})` }}><blockquote><LocalizedText text={"“In the remembrance of Allah do hearts find rest.”"} /><small><LocalizedText text={"QURAN 13:28"} /></small></blockquote></div></main>;
}
