import { useEffect, useState } from "react";
import { diagnoseDisease } from "../api";
import {
  ActivityIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  UploadCloudIcon,
} from "./Icons";

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

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
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
      <div className="card-header">
        <h2>
          <ActivityIcon width="20" height="20" />
          Crop leaf stress diagnostic
        </h2>
        <p className="card-desc">
          Upload a close-up leaf photo. This v1 uses an explainable computer-vision heuristic
          (tissue color analysis) rather than a trained CNN &mdash; see the README for the model
          upgrade path once labeled field images are collected via the federation network.
        </p>
      </div>

      <label htmlFor="leaf-photo-input" className="field" style={{ cursor: "pointer" }}>
        <span>Leaf photo (JPEG, PNG or WEBP)</span>
        <div className="dropzone-container">
          <UploadCloudIcon className="dropzone-icon" />
          <div className="dropzone-text">
            {file ? file.name : "Click to select or drag and drop leaf photo"}
          </div>
          <div className="dropzone-hint">Supported formats: JPEG, PNG, WEBP (Max 10MB)</div>
        </div>
        <input
          id="leaf-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
        />
      </label>

      {preview && (
        <div style={{ textAlign: "center" }}>
          <div className="preview-wrapper">
            <img src={preview} alt="Leaf preview" className="leaf-preview" />
          </div>
        </div>
      )}

      <div className="button-row">
        <button className="primary" onClick={submit} disabled={!file || loading}>
          {loading ? (
            <>
              <LoaderIcon width="16" height="16" />
              <span>Analyzing leaf tissue...</span>
            </>
          ) : (
            <>
              <CheckCircleIcon width="16" height="16" />
              <span>Diagnose leaf</span>
            </>
          )}
        </button>
        {(file || result) && (
          <button type="button" className="btn-outline" onClick={reset} disabled={loading}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: "var(--danger-light)", border: "1px solid var(--danger-border)" }}>
          <p className="error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircleIcon width="16" height="16" />
            {error}
          </p>
        </div>
      )}

      {result && (
        <div className={`diagnosis-result priority-${result.stress_level === "healthy" ? "low" : "high"}`}>
          <div className="diagnosis-header">
            <h3>{STRESS_LABEL[result.stress_level]}</h3>
            <span className="badge">
              {result.stress_level === "healthy" ? "Normal Vitality" : "Stress Alert"}
            </span>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Healthy tissue</span>
              <span>{result.healthy_tissue_pct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${result.healthy_tissue_pct}%` }} />
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Tissue discoloration / necrosis</span>
              <span>{result.discoloration_pct}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-danger"
                style={{ width: `${result.discoloration_pct}%` }}
              />
            </div>
          </div>

          {result.likely_causes.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <strong style={{ fontSize: "0.8125rem", color: "var(--text)" }}>Likely causes:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                {result.likely_causes.map((c, idx) => (
                  <span key={idx} className="badge" style={{ background: "var(--cream)", border: "1px solid var(--panel-border)", color: "var(--text)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "6px", background: "var(--panel)", border: "1px solid var(--panel-border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", display: "block" }}>
              Recommended Action
            </span>
            <p className="card-desc" style={{ marginTop: "2px", color: "var(--text)", fontWeight: 500 }}>
              {result.recommended_action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
