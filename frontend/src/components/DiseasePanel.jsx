import { useState } from "react";
import { diagnoseDisease } from "../api";

const STRESS_LABEL = {
  healthy: "Healthy",
  mild_stress: "Mild stress",
  moderate_stress: "Moderate stress",
  severe_stress: "Severe stress",
};

export default function DiseasePanel() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const diagnosis = await diagnoseDisease(file);
      setResult(diagnosis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Crop leaf stress diagnostic</h2>
      <p className="muted small">
        Upload a close-up leaf photo. This v1 uses an explainable computer-vision heuristic
        (tissue color analysis) rather than a trained CNN &mdash; see the README for the model
        upgrade path once labeled field images are collected via the federation network.
      </p>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
      {preview && <img src={preview} alt="leaf preview" className="leaf-preview" />}
      <button className="primary" onClick={submit} disabled={!file || loading}>
        {loading ? "Analyzing..." : "Diagnose leaf"}
      </button>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className={`diagnosis-result priority-${result.stress_level === "healthy" ? "low" : "high"}`}>
          <h3>{STRESS_LABEL[result.stress_level]}</h3>
          <p>Healthy tissue: {result.healthy_tissue_pct}% &middot; Discoloration: {result.discoloration_pct}%</p>
          {result.likely_causes.length > 0 && (
            <p>Likely causes: {result.likely_causes.join(", ")}</p>
          )}
          <p className="muted small">{result.recommended_action}</p>
        </div>
      )}
    </div>
  );
}
