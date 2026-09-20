import { useEffect, useState } from "react";
import {
  fetchFederationInsights,
  fetchFederationNodes,
  fetchFederationStats,
  registerFederationNode,
  submitFederationInsight,
} from "../api";
import {
  ActivityIcon,
  GlobeIcon,
  LoaderIcon,
  ServerIcon,
  SparklesIcon,
} from "./Icons";

const BRICS_SEED = [
  { node_id: "in-mh-01", country: "India", region: "Maharashtra" },
  { node_id: "br-mg-01", country: "Brazil", region: "Minas Gerais" },
  { node_id: "za-fs-01", country: "South Africa", region: "Free State" },
  { node_id: "ru-kk-01", country: "Russia", region: "Krasnodar Krai" },
  { node_id: "cn-hn-01", country: "China", region: "Henan" },
];

const EMPTY_NODE = { node_id: "", country: "", region: "" };
const EMPTY_INSIGHT = {
  node_id: "",
  country: "",
  region: "",
  crop: "",
  avg_soil_health_score: "",
  dominant_regenerative_practice: "",
  sample_size: "",
};

export default function CooperationPanel() {
  const [stats, setStats] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [nodeForm, setNodeForm] = useState(EMPTY_NODE);
  const [insightForm, setInsightForm] = useState(EMPTY_INSIGHT);
  const [nodeSubmitting, setNodeSubmitting] = useState(false);
  const [insightSubmitting, setInsightSubmitting] = useState(false);

  const refresh = async () => {
    const [s, n, i] = await Promise.all([
      fetchFederationStats(),
      fetchFederationNodes(),
      fetchFederationInsights(),
    ]);
    setStats(s);
    setNodes(n);
    setInsights(i);
  };

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  const seedDemoNetwork = async () => {
    setBusy(true);
    setError(null);
    try {
      for (const node of BRICS_SEED) {
        await registerFederationNode({ ...node, contact: null });
      }
      const practices = [
        "legume rotation",
        "cover cropping",
        "reduced tillage",
        "compost amendment",
        "contour bunding",
      ];
      const crops = ["wheat", "maize", "soybean", "rice", "sorghum"];
      for (let idx = 0; idx < BRICS_SEED.length; idx++) {
        const node = BRICS_SEED[idx];
        await submitFederationInsight({
          node_id: node.node_id,
          country: node.country,
          region: node.region,
          crop: crops[idx],
          avg_soil_health_score: 65 + idx * 5,
          dominant_regenerative_practice: practices[idx],
          sample_size: 80 + idx * 30,
          submitted_at: new Date().toISOString(),
        });
      }
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitNode = async (e) => {
    e.preventDefault();
    setNodeSubmitting(true);
    setError(null);
    try {
      await registerFederationNode({ ...nodeForm, contact: null });
      setNodeForm(EMPTY_NODE);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setNodeSubmitting(false);
    }
  };

  const submitInsight = async (e) => {
    e.preventDefault();
    setInsightSubmitting(true);
    setError(null);
    try {
      await submitFederationInsight({
        ...insightForm,
        avg_soil_health_score: parseFloat(insightForm.avg_soil_health_score),
        sample_size: parseInt(insightForm.sample_size, 10),
        submitted_at: new Date().toISOString(),
      });
      setInsightForm(EMPTY_INSIGHT);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setInsightSubmitting(false);
    }
  };

  return (
    <div className="cooperation-layout">
      {/* 1. BRICS Cooperation Network Box (Same size as AgriNexus Header Box) */}
      <div className="card">
        <div className="card-header">
          <h2>
            <GlobeIcon width="20" height="20" />
            BRICS cooperation network
          </h2>
          <p className="card-desc">
            Each participating region runs its own AgriNexus node and publishes only aggregated,
            anonymized soil-health and regenerative-practice signals here &mdash; the shared,
            interoperable "digital public good" layer called for by the AgriN brief, without any
            individual farmer data crossing borders.
          </p>
        </div>

        {error && <p className="error" style={{ marginBottom: "14px" }}>{error}</p>}

        {stats && (
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "20px" }}>
            <div className="stat-widget">
              <span className="stat-widget-icon"><ServerIcon width="16" height="16" /></span>
              <span className="stat-label">Registered nodes</span>
              <span className="stat-value">{stats.registered_nodes}</span>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-icon"><GlobeIcon width="16" height="16" /></span>
              <span className="stat-label">Countries</span>
              <span className="stat-value">{stats.participating_countries.length}</span>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-icon"><ActivityIcon width="16" height="16" /></span>
              <span className="stat-label">Insights shared</span>
              <span className="stat-value">{stats.total_insights_shared}</span>
            </div>
          </div>
        )}

        <button className="primary" onClick={seedDemoNetwork} disabled={busy} style={{ marginBottom: "16px" }}>
          {busy ? (
            <>
              <LoaderIcon width="16" height="16" />
              <span>Syncing network data...</span>
            </>
          ) : (
            <>
              <SparklesIcon width="16" height="16" />
              <span>Simulate BRICS network sync (demo)</span>
            </>
          )}
        </button>

        {insights.length > 0 ? (
          <div className="table-wrapper">
            <table className="insight-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Region</th>
                  <th>Crop</th>
                  <th>Soil score</th>
                  <th>Leading practice</th>
                  <th>Sample</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((i, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{i.country}</td>
                    <td>{i.region}</td>
                    <td style={{ textTransform: "capitalize" }}>{i.crop}</td>
                    <td>
                      <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--panel-border)" }}>
                        {i.avg_soil_health_score}
                      </span>
                    </td>
                    <td>{i.dominant_regenerative_practice}</td>
                    <td>{i.sample_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-card" style={{ padding: "32px 16px" }}>
            <p className="muted small">No insights shared yet. Try the demo sync above.</p>
          </div>
        )}
      </div>

      {/* 2. Register a Node & Publish an Insight in ONE LINE as SEPARATE BOXES */}
      <div className="cooperation-forms-row">
        <div className="card">
          <div className="card-header">
            <h2>
              <ServerIcon width="18" height="18" />
              Register a node
            </h2>
            <p className="card-desc">Add your own regional node to the network manually.</p>
          </div>
          <form onSubmit={submitNode} className="cooperation-form-flex">
            <div>
              <label className="field">
                <span>Node ID</span>
                <input
                  required
                  value={nodeForm.node_id}
                  onChange={(e) => setNodeForm((f) => ({ ...f, node_id: e.target.value }))}
                  placeholder="e.g. in-mh-01"
                />
              </label>
              <div className="grid-2">
                <label className="field">
                  <span>Country</span>
                  <input
                    required
                    value={nodeForm.country}
                    onChange={(e) => setNodeForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="e.g. India"
                  />
                </label>
                <label className="field">
                  <span>Region</span>
                  <input
                    required
                    value={nodeForm.region}
                    onChange={(e) => setNodeForm((f) => ({ ...f, region: e.target.value }))}
                    placeholder="e.g. Maharashtra"
                  />
                </label>
              </div>
            </div>
            <button type="submit" className="primary" disabled={nodeSubmitting} style={{ marginTop: "16px" }}>
              {nodeSubmitting ? "Registering..." : "Register node"}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>
              <ActivityIcon width="18" height="18" />
              Publish an insight
            </h2>
            <p className="card-desc">Share an aggregated regional signal with partner nations.</p>
          </div>
          <form onSubmit={submitInsight} className="cooperation-form-flex">
            <div>
              <label className="field">
                <span>Node ID</span>
                <input
                  required
                  value={insightForm.node_id}
                  onChange={(e) => setInsightForm((f) => ({ ...f, node_id: e.target.value }))}
                  placeholder="e.g. in-mh-01"
                />
              </label>
              <div className="grid-2">
                <label className="field">
                  <span>Country</span>
                  <input
                    required
                    value={insightForm.country}
                    onChange={(e) => setInsightForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="e.g. India"
                  />
                </label>
                <label className="field">
                  <span>Region</span>
                  <input
                    required
                    value={insightForm.region}
                    onChange={(e) => setInsightForm((f) => ({ ...f, region: e.target.value }))}
                    placeholder="e.g. Maharashtra"
                  />
                </label>
              </div>
              <div className="grid-2">
                <label className="field">
                  <span>Crop</span>
                  <input
                    required
                    value={insightForm.crop}
                    onChange={(e) => setInsightForm((f) => ({ ...f, crop: e.target.value }))}
                    placeholder="e.g. cotton"
                  />
                </label>
                <label className="field">
                  <span>Avg soil health score</span>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={insightForm.avg_soil_health_score}
                    onChange={(e) =>
                      setInsightForm((f) => ({ ...f, avg_soil_health_score: e.target.value }))
                    }
                    placeholder="e.g. 75"
                  />
                </label>
              </div>
              <div className="grid-2">
                <label className="field">
                  <span>Leading practice</span>
                  <input
                    required
                    value={insightForm.dominant_regenerative_practice}
                    onChange={(e) =>
                      setInsightForm((f) => ({ ...f, dominant_regenerative_practice: e.target.value }))
                    }
                    placeholder="e.g. legume rotation"
                  />
                </label>
                <label className="field">
                  <span>Sample size</span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={insightForm.sample_size}
                    onChange={(e) => setInsightForm((f) => ({ ...f, sample_size: e.target.value }))}
                    placeholder="e.g. 120"
                  />
                </label>
              </div>
            </div>
            <button type="submit" className="primary" disabled={insightSubmitting} style={{ marginTop: "16px" }}>
              {insightSubmitting ? "Publishing..." : "Publish insight"}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Registered Nodes List Box (Same size as AgriNexus Header Box) */}
      {nodes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>
              <ServerIcon width="18" height="18" />
              Registered nodes ({nodes.length})
            </h2>
            <p className="card-desc">Active participating national and regional nodes.</p>
          </div>
          <div className="table-wrapper">
            <table className="insight-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Country</th>
                  <th>Region</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.node_id}>
                    <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{n.node_id}</td>
                    <td>{n.country}</td>
                    <td>{n.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
