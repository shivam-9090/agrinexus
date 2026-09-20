import { useState } from "react";
import AdvisoryForm from "./components/AdvisoryForm";
import AdvisoryResults from "./components/AdvisoryResults";
import DiseasePanel from "./components/DiseasePanel";
import CooperationPanel from "./components/CooperationPanel";
import { fetchAdvisory } from "./api";
import { SproutIcon, SatelliteIcon, ActivityIcon, GlobeIcon, LoaderIcon } from "./components/Icons";
import { useLanguage } from "./i18n/LanguageContext";
import { LANGUAGES } from "./i18n/translations";
import "./App.css";

const TABS = [
  { id: "advisory", icon: SproutIcon },
  { id: "disease", icon: ActivityIcon },
  { id: "cooperation", icon: GlobeIcon },
];

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
        <div className="brand-section">
          <div className="brand-icon">
            <SproutIcon width="24" height="24" />
          </div>
          <div>
            <div className="brand-title">
              <h1>AgriNexus</h1>
              <span className="badge-tag">Track 4 · BRICS</span>
            </div>
            <p className="brand-sub">
              {t("app.subtitle")}
            </p>
          </div>
        </div>
        <div className="header-controls">
          <nav className="tabs" aria-label="Navigation Tabs">
            {TABS.map((tItem) => {
              const IconComponent = tItem.icon;
              return (
                <button
                  key={tItem.id}
                  className={tab === tItem.id ? "tab active" : "tab"}
                  onClick={() => setTab(tItem.id)}
                >
                  <IconComponent width="15" height="15" />
                  {t(`app.tab.${tItem.id}`)}
                </button>
              );
            })}
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
            <div className="advisory-output">
              {error && (
                <div className="card" style={{ borderLeft: "4px solid var(--danger)", marginBottom: "16px" }}>
                  <p className="error" role="alert">{error}</p>
                </div>
              )}
              {loading && (
                <div className="card empty-state-card" aria-live="polite">
                  <div className="empty-icon-box">
                    <LoaderIcon width="20" height="20" />
                  </div>
                  <h3 className="empty-title">{t("app.loadingAdvisory")}</h3>
                </div>
              )}
              {!loading && !advisory && !error && (
                <div className="empty-state-card">
                  <div className="empty-icon-box">
                    <SatelliteIcon width="20" height="20" />
                  </div>
                  <h3 className="empty-title">Awaiting Farm Telemetry</h3>
                  <p className="empty-desc">
                    {t("app.emptyState")}
                  </p>
                  <div className="feature-pills">
                    <span className="feature-pill">🛰️ NASA Satellite Climatology</span>
                    <span className="feature-pill">🌦️ Live 7-Day Open-Meteo</span>
                    <span className="feature-pill">🌱 Explainable Regenerative Rules</span>
                  </div>
                </div>
              )}
              {!loading && advisory && (
                <button type="button" className="reset-link" onClick={() => setAdvisory(null)}>
                  &larr; {t("app.clearResults")}
                </button>
              )}
              {!loading && <AdvisoryResults data={advisory} />}
            </div>
            <AdvisoryForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}

        {tab === "disease" && <DiseasePanel />}
        {tab === "cooperation" && <CooperationPanel />}
      </main>

      <footer className="app-footer">
        <p>{t("app.footer")}</p>
      </footer>
    </div>
  );
}
