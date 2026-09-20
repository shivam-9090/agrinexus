import { useState } from "react";
import AdvisoryForm from "./components/AdvisoryForm";
import AdvisoryResults from "./components/AdvisoryResults";
import DiseasePanel from "./components/DiseasePanel";
import CooperationPanel from "./components/CooperationPanel";
import { fetchAdvisory } from "./api";
import { SproutIcon, SatelliteIcon, ActivityIcon, GlobeIcon, LoaderIcon } from "./components/Icons";
import "./App.css";

const TABS = [
  { id: "advisory", label: "Farm advisory", icon: SproutIcon },
  { id: "disease", label: "Leaf diagnostics", icon: ActivityIcon },
  { id: "cooperation", label: "BRICS cooperation", icon: GlobeIcon },
];

export default function App() {
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
              Open regenerative agriculture intelligence for AgriN &amp; BRICS Cooperation
            </p>
          </div>
        </div>
        <nav className="tabs" aria-label="Navigation Tabs">
          {TABS.map((t) => {
            const IconComponent = t.icon;
            return (
              <button
                key={t.id}
                className={tab === t.id ? "tab active" : "tab"}
                onClick={() => setTab(t.id)}
              >
                <IconComponent width="15" height="15" />
                {t.label}
              </button>
            );
          })}
        </nav>
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
                  <h3 className="empty-title">Generating Regenerative Advisory</h3>
                  <p className="empty-desc">
                    Fetching live weather from Open-Meteo, satellite agro-climatology from NASA POWER, and running the crop recommendation model...
                  </p>
                </div>
              )}
              {!loading && !advisory && !error && (
                <div className="empty-state-card">
                  <div className="empty-icon-box">
                    <SatelliteIcon width="20" height="20" />
                  </div>
                  <h3 className="empty-title">Awaiting Farm Telemetry</h3>
                  <p className="empty-desc">
                    Fill in your farm's soil test and location, then request an advisory to see
                    live weather, satellite agro-climatology, AI crop recommendations and
                    regenerative practice guidance.
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
                  &larr; Clear results
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
        <p>
          Built for Hack2Skill "Build with AI: Code for Communities" &mdash; Track 4 (AgriN &amp;
          Regenerative Agricultural Intelligence). Live data: Open-Meteo &amp; NASA POWER.
        </p>
      </footer>
    </div>
  );
}
