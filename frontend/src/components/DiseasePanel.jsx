import { useEffect, useState } from "react";
import { diagnoseDisease } from "../api";
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
      <h2>{t("diseasePanel.heading")}</h2>
      <p className="muted small">{t("diseasePanel.description")}</p>
      <label className="field">
        <span>{t("diseasePanel.photoLabel")}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
      </label>
      {preview && <img src={preview} alt="Leaf preview" className="leaf-preview" />}
      <div className="button-row">
        <button className="primary" onClick={submit} disabled={!file || loading}>
          {loading ? t("diseasePanel.analyzing") : t("diseasePanel.diagnose")}
        </button>
        {(file || result) && (
          <button type="button" onClick={reset} disabled={loading}>
            {t("diseasePanel.clear")}
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className={`diagnosis-result priority-${result.stress_level === "healthy" ? "low" : "high"}`}>
          <h3>{t(`diseasePanel.stress.${result.stress_level}`)}</h3>
          {result.predicted_label && (
            <p>
              {t("diseasePanel.confidence", {
                label: result.predicted_label,
                pct: Math.round(result.confidence * 100),
              })}
            </p>
          )}
          {result.healthy_tissue_pct !== null && result.healthy_tissue_pct !== undefined && (
            <p>
              {t("diseasePanel.healthyTissue", {
                healthy: result.healthy_tissue_pct,
                discoloration: result.discoloration_pct,
              })}
            </p>
          )}
          {result.likely_causes.length > 0 && (
            <p>{t("diseasePanel.likelyCauses", { causes: result.likely_causes.join(", ") })}</p>
          )}
          <p className="muted small">{result.recommended_action}</p>
          <p className="muted small">{t("diseasePanel.method", { method: result.method })}</p>
        </div>
      )}
    </div>
  );
}
