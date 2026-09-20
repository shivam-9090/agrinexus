import { useEffect, useState } from "react";
import { diagnoseDisease } from "../api";
import {
  ActivityIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  UploadCloudIcon,
} from "./Icons";
import { useLanguage } from "../i18n/LanguageContext";

export default function DiseasePanel() {
  const { t } = useLanguage();
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
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setFile(chosen);
    setResult(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(chosen));
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await diagnoseDisease(file);
      setResult(data);
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
          {t("diseasePanel.heading")}
        </h2>
        <p className="card-desc">
          {t("diseasePanel.description")}
        </p>
      </div>

      <label htmlFor="leaf-photo-input" className="field" style={{ cursor: "pointer" }}>
        <span>{t("diseasePanel.photoLabel")}</span>
        <div className="dropzone-container">
          <UploadCloudIcon className="dropzone-icon" />
          <div className="dropzone-text">
            {file ? file.name : "Click to select or drag and drop leaf photo"}
          </div>
          <div className="dropzone-hint">Supported formats: JPEG, PNG, WEBP (Max 10MB)</div>
        </div>
        <input
          id="leaf-photo-input"
          aria-label={t("diseasePanel.photoLabel")}
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
              <span>{t("diseasePanel.analyzing")}</span>
            </>
          ) : (
            <>
              <CheckCircleIcon width="16" height="16" />
              <span>{t("diseasePanel.diagnose")}</span>
            </>
          )}
        </button>
        {(file || result) && (
          <button type="button" className="btn-outline" onClick={reset} disabled={loading}>
            {t("diseasePanel.clear")}
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
            <h3>{t(`diseasePanel.stress.${result.stress_level}`)}</h3>
            <span className="badge">
              {result.stress_level === "healthy" ? "Normal Vitality" : "Stress Alert"}
            </span>
          </div>

          {result.predicted_label && (
            <p style={{ fontWeight: 600, color: "var(--primary)", marginTop: "4px" }}>
              {t("diseasePanel.confidence", {
                label: result.predicted_label,
                pct: Math.round(result.confidence * 100),
              })}
            </p>
          )}

          {result.healthy_tissue_pct !== null && result.healthy_tissue_pct !== undefined && (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "6px" }}>
                {t("diseasePanel.healthyTissue", {
                  healthy: result.healthy_tissue_pct,
                  discoloration: result.discoloration_pct,
                })}
              </p>
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
            </>
          )}

          {result.likely_causes.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                {t("diseasePanel.likelyCauses", { causes: result.likely_causes.join(", ") })}
              </p>
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

          {result.method && (
            <p className="muted small" style={{ marginTop: "10px" }}>
              {t("diseasePanel.method", { method: result.method })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
