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

export default function CooperationPanel() {
  const [stats, setStats] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [busy, setBusy] = useState(false);

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
    refresh().catch(() => {});
  }, []);

  const seedDemoNetwork = async () => {
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>BRICS cooperation network</h2>
      <p className="muted small">
        Each participating region runs its own AgriNexus node and publishes only aggregated,
        anonymized soil-health and regenerative-practice signals here &mdash; the shared,
        interoperable "digital public good" layer called for by the AgriN brief, without any
        individual farmer data crossing borders.
      </p>

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

      {insights.length > 0 && (
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
      )}
    </div>
  );
}
