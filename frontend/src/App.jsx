import { useState } from "react";
import AdvisoryForm from "./components/AdvisoryForm";
import AdvisoryResults from "./components/AdvisoryResults";
import DiseasePanel from "./components/DiseasePanel";
import CooperationPanel from "./components/CooperationPanel";
import { fetchAdvisory } from "./api";
import "./App.css";

const TABS = [
  { id: "advisory", label: "Farm advisory" },
  { id: "disease", label: "Leaf diagnostics" },
  { id: "cooperation", label: "BRICS cooperation" },
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
        <div>
          <h1>AgriNexus</h1>
          <p className="muted">
            Open regenerative agriculture intelligence for Track 4 &middot; AgriN &amp; BRICS Cooperation
          </p>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "advisory" && (
          <div className="advisory-layout">
            <AdvisoryForm onSubmit={handleSubmit} loading={loading} />
            <div className="advisory-output">
              {error && <p className="error" role="alert">{error}</p>}
              {loading && (
                <div className="card placeholder" aria-live="polite">
                  <p className="muted">
                    Fetching live weather and satellite data, then running the advisory model...
                  </p>
                </div>
              )}
              {!loading && !advisory && !error && (
                <div className="card placeholder">
                  <p className="muted">
                    Fill in your farm's soil test and location, then request an advisory to see
                    live weather, satellite agro-climatology, AI crop recommendations and
                    regenerative practice guidance.
                  </p>
                </div>
              )}
              {!loading && advisory && (
                <button type="button" className="reset-link" onClick={() => setAdvisory(null)}>
                  Clear results
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
        <p className="muted small">
          Built for Hack2Skill "Build with AI: Code for Communities" &mdash; Track 4 (AgriN &amp;
          Regenerative Agricultural Intelligence). Live data: Open-Meteo &amp; NASA POWER.
        </p>
      </footer>
    </div>
  );
}
