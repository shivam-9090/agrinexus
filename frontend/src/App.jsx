import { useState } from "react";
import AdvisoryForm from "./components/AdvisoryForm";
import AdvisoryResults from "./components/AdvisoryResults";
import DiseasePanel from "./components/DiseasePanel";
import CooperationPanel from "./components/CooperationPanel";
import { fetchAdvisory } from "./api";
import { useLanguage } from "./i18n/LanguageContext";
import { LANGUAGES } from "./i18n/translations";
import "./App.css";

const TAB_IDS = ["advisory", "disease", "cooperation"];

export default function App() {
  const { t, lang, setLang } = useLanguage();
  const [tab, setTab] = useState("advisory");
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdvisory(payload);
      setAdvisory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>AgriNexus</h1>
          <p className="muted">{t("app.subtitle")}</p>
        </div>
        <div className="header-controls">
          <nav className="tabs">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                className={tab === id ? "tab active" : "tab"}
                onClick={() => setTab(id)}
              >
                {t(`app.tab.${id}`)}
              </button>
            ))}
          </nav>
          <label className="language-picker">
            <span className="sr-only">{t("app.language")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t("app.language")}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main>
        {tab === "advisory" && (
          <div className="advisory-layout">
            <AdvisoryForm onSubmit={handleSubmit} loading={loading} />
            <div className="advisory-output">
              {error && <p className="error" role="alert">{error}</p>}
              {loading && (
                <div className="card placeholder" aria-live="polite">
                  <p className="muted">{t("app.loadingAdvisory")}</p>
                </div>
              )}
              {!loading && !advisory && !error && (
                <div className="card placeholder">
                  <p className="muted">{t("app.emptyState")}</p>
                </div>
              )}
              {!loading && advisory && (
                <button type="button" className="reset-link" onClick={() => setAdvisory(null)}>
                  {t("app.clearResults")}
                </button>
              )}
              {!loading && <AdvisoryResults data={advisory} />}
            </div>
          </div>
        )}

        {tab === "disease" && <DiseasePanel />}
        {tab === "cooperation" && <CooperationPanel />}
      </main>

      <footer className="app-footer">
        <p className="muted small">{t("app.footer")}</p>
      </footer>
    </div>
  );
}
