import { useEffect, useState } from "react";
import {
  fetchFederationInsights,
  fetchFederationNodes,
  fetchFederationStats,
  registerFederationNode,
  submitFederationInsight,
} from "../api";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();
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
        <h2>{t("cooperationPanel.heading")}</h2>
        <p className="muted small">{t("cooperationPanel.description")}</p>

        {error && <p className="error">{error}</p>}

        {stats && (
          <div className="stat-grid">
            <div>
              <span className="stat-value">{stats.registered_nodes}</span>
              <span className="stat-label">{t("cooperationPanel.registeredNodes")}</span>
            </div>
            <div>
              <span className="stat-value">{stats.participating_countries.length}</span>
              <span className="stat-label">{t("cooperationPanel.countries")}</span>
            </div>
            <div>
              <span className="stat-value">{stats.total_insights_shared}</span>
              <span className="stat-label">{t("cooperationPanel.insightsShared")}</span>
            </div>
          </div>
        )}

        <button className="primary" onClick={seedDemoNetwork} disabled={busy}>
          {busy ? t("cooperationPanel.syncing") : t("cooperationPanel.simulateSync")}
        </button>

        {insights.length > 0 ? (
          <table className="insight-table">
            <thead>
              <tr>
                <th>{t("cooperationPanel.tableCountry")}</th>
                <th>{t("cooperationPanel.tableRegion")}</th>
                <th>{t("cooperationPanel.tableCrop")}</th>
                <th>{t("cooperationPanel.tableSoilScore")}</th>
                <th>{t("cooperationPanel.tableLeadingPractice")}</th>
                <th>{t("cooperationPanel.tableSample")}</th>
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
          <p className="muted small">{t("cooperationPanel.noInsights")}</p>
        )}
      </div>

      <div className="card">
        <h2>{t("cooperationPanel.registerNodeHeading")}</h2>
        <p className="muted small">{t("cooperationPanel.registerNodeDescription")}</p>
        <form onSubmit={submitNode}>
          <label className="field">
            <span>{t("cooperationPanel.nodeId")}</span>
            <input
              required
              value={nodeForm.node_id}
              onChange={(e) => setNodeForm((f) => ({ ...f, node_id: e.target.value }))}
              placeholder={t("cooperationPanel.nodeIdPlaceholder")}
            />
          </label>
          <label className="field">
            <span>{t("cooperationPanel.country")}</span>
            <input
              required
              value={nodeForm.country}
              onChange={(e) => setNodeForm((f) => ({ ...f, country: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>{t("cooperationPanel.region")}</span>
            <input
              required
              value={nodeForm.region}
              onChange={(e) => setNodeForm((f) => ({ ...f, region: e.target.value }))}
            />
          </label>
          <button type="submit" className="primary" disabled={nodeSubmitting}>
            {nodeSubmitting ? t("cooperationPanel.registering") : t("cooperationPanel.registerNode")}
          </button>
        </form>

        <h2>{t("cooperationPanel.publishInsightHeading")}</h2>
        <p className="muted small">{t("cooperationPanel.publishInsightDescription")}</p>
        <form onSubmit={submitInsight}>
          <label className="field">
            <span>{t("cooperationPanel.nodeId")}</span>
            <input
              required
              value={insightForm.node_id}
              onChange={(e) => setInsightForm((f) => ({ ...f, node_id: e.target.value }))}
            />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>{t("cooperationPanel.country")}</span>
              <input
                required
                value={insightForm.country}
                onChange={(e) => setInsightForm((f) => ({ ...f, country: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>{t("cooperationPanel.region")}</span>
              <input
                required
                value={insightForm.region}
                onChange={(e) => setInsightForm((f) => ({ ...f, region: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>{t("cooperationPanel.crop")}</span>
              <input
                required
                value={insightForm.crop}
                onChange={(e) => setInsightForm((f) => ({ ...f, crop: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>{t("cooperationPanel.avgSoilHealthScore")}</span>
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
              <span>{t("cooperationPanel.leadingPractice")}</span>
              <input
                required
                value={insightForm.dominant_regenerative_practice}
                onChange={(e) =>
                  setInsightForm((f) => ({ ...f, dominant_regenerative_practice: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>{t("cooperationPanel.sampleSize")}</span>
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
            {insightSubmitting ? t("cooperationPanel.publishing") : t("cooperationPanel.publishInsight")}
          </button>
        </form>
      </div>

      {nodes.length > 0 && (
        <div className="card span-2">
          <h2>{t("cooperationPanel.registeredNodesHeading", { count: nodes.length })}</h2>
          <table className="insight-table">
            <thead>
              <tr>
                <th>{t("cooperationPanel.tableNodeId")}</th>
                <th>{t("cooperationPanel.tableCountry")}</th>
                <th>{t("cooperationPanel.tableRegion")}</th>
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
