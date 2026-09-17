import { useEffect, useState } from "react";
import {
  fetchFederationInsights,
  fetchFederationNodes,
  fetchFederationStats,
  registerFederationNode,
  submitFederationInsight,
} from "../api";

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
      <div className="card">
        <h2>BRICS cooperation network</h2>
        <p className="muted small">
          Each participating region runs its own AgriNexus node and publishes only aggregated,
          anonymized soil-health and regenerative-practice signals here &mdash; the shared,
          interoperable "digital public good" layer called for by the AgriN brief, without any
          individual farmer data crossing borders.
        </p>

        {error && <p className="error">{error}</p>}

        {stats && (
          <div className="stat-grid">
            <div>
              <span className="stat-value">{stats.registered_nodes}</span>
              <span className="stat-label">Registered nodes</span>
            </div>
            <div>
              <span className="stat-value">{stats.participating_countries.length}</span>
              <span className="stat-label">Countries</span>
            </div>
            <div>
              <span className="stat-value">{stats.total_insights_shared}</span>
              <span className="stat-label">Insights shared</span>
            </div>
          </div>
        )}

        <button className="primary" onClick={seedDemoNetwork} disabled={busy}>
          {busy ? "Syncing..." : "Simulate BRICS network sync (demo)"}
        </button>

        {insights.length > 0 ? (
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
                  <td>{i.country}</td>
                  <td>{i.region}</td>
                  <td>{i.crop}</td>
                  <td>{i.avg_soil_health_score}</td>
                  <td>{i.dominant_regenerative_practice}</td>
                  <td>{i.sample_size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted small">No insights shared yet. Try the demo sync above.</p>
        )}
      </div>

      <div className="card">
        <h2>Register a node</h2>
        <p className="muted small">Add your own regional node to the network manually.</p>
        <form onSubmit={submitNode}>
          <label className="field">
            <span>Node ID</span>
            <input
              required
              value={nodeForm.node_id}
              onChange={(e) => setNodeForm((f) => ({ ...f, node_id: e.target.value }))}
              placeholder="e.g. in-mh-01"
            />
          </label>
          <label className="field">
            <span>Country</span>
            <input
              required
              value={nodeForm.country}
              onChange={(e) => setNodeForm((f) => ({ ...f, country: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Region</span>
            <input
              required
              value={nodeForm.region}
              onChange={(e) => setNodeForm((f) => ({ ...f, region: e.target.value }))}
            />
          </label>
          <button type="submit" className="primary" disabled={nodeSubmitting}>
            {nodeSubmitting ? "Registering..." : "Register node"}
          </button>
        </form>

        <h2>Publish an insight</h2>
        <p className="muted small">Share an aggregated regional signal.</p>
        <form onSubmit={submitInsight}>
          <label className="field">
            <span>Node ID</span>
            <input
              required
              value={insightForm.node_id}
              onChange={(e) => setInsightForm((f) => ({ ...f, node_id: e.target.value }))}
            />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Country</span>
              <input
                required
                value={insightForm.country}
                onChange={(e) => setInsightForm((f) => ({ ...f, country: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Region</span>
              <input
                required
                value={insightForm.region}
                onChange={(e) => setInsightForm((f) => ({ ...f, region: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Crop</span>
              <input
                required
                value={insightForm.crop}
                onChange={(e) => setInsightForm((f) => ({ ...f, crop: e.target.value }))}
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
              />
            </label>
            <label className="field">
              <span>Leading practice</span>
              <input
                required
                value={insightForm.dominant_regenerative_practice}
                onChange={(e) =>
                  setInsightForm((f) => ({ ...f, dominant_regenerative_practice: e.target.value }))
                }
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
              />
            </label>
          </div>
          <button type="submit" className="primary" disabled={insightSubmitting}>
            {insightSubmitting ? "Publishing..." : "Publish insight"}
          </button>
        </form>
      </div>

      {nodes.length > 0 && (
        <div className="card span-2">
          <h2>Registered nodes ({nodes.length})</h2>
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
                  <td>{n.node_id}</td>
                  <td>{n.country}</td>
                  <td>{n.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
