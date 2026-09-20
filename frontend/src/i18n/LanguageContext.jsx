import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, translations } from "./translations";

const STORAGE_KEY = "agrinexus.language";

const LanguageContext = createContext(null);

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && translations[stored] ? stored : DEFAULT_LANGUAGE;
  } catch {
    // localStorage can throw in private browsing / disabled-storage contexts
    return DEFAULT_LANGUAGE;
  }
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLanguage);

  const setLang = (next) => {
    if (!translations[next]) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures (private browsing, storage disabled, etc.)
    }
  };

  const t = useMemo(() => {
    return (key, vars) => {
      const template = translations[lang]?.[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
      return interpolate(template, vars);
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
