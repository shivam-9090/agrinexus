import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  CheckCircleIcon,
  DropletIcon,
  SatelliteIcon,
  SparklesIcon,
  SproutIcon,
  SunIcon,
  ThermometerIcon,
} from "./Icons";
import { useLanguage } from "../i18n/LanguageContext";

export default function AdvisoryResults({ data }) {
  const { t } = useLanguage();
  if (!data) return null;

  const chartData = data.weather.daily_dates.map((date, i) => ({
    date: date.slice(5),
    max: data.weather.temperature_max_c[i],
    min: data.weather.temperature_min_c[i],
    rain: data.weather.precipitation_mm[i],
  }));

  return (
    <div className="results">
      <div className="card">
        <div className="card-header">
          <h2>
            <ActivityIcon width="18" height="18" />
            {t("advisoryResults.soilHealthScore")}
          </h2>
          <p className="card-desc">
            {t("advisoryResults.soilHealthDescription", { place: data.location.place_name })}
          </p>
        </div>
        <div className="score-ring" style={{ "--score": data.soil_health_score }}>
          <span>{data.soil_health_score}</span>
        </div>
        <p className="muted small">0–100 index normalized across agronomic requirement thresholds.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>
            <SproutIcon width="18" height="18" />
            {t("advisoryResults.recommendedCrops")}
          </h2>
          <p className="card-desc">Ranked by RandomForest crop classifier with local environmental fit.</p>
        </div>
        <ol className="crop-list">
          {data.crop_recommendations.map((c) => (
            <li key={c.crop} className="crop-card">
              <div className="crop-head">
                <span className="crop-title">
                  <SparklesIcon width="14" height="14" />
                  {c.crop}
                </span>
                <span className="crop-badge">{Math.round(c.confidence * 100)}%</span>
              </div>
              <p className="card-desc" style={{ marginTop: "6px" }}>{c.rationale}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>
            <SunIcon width="18" height="18" />
            {t("advisoryResults.weatherForecast")}
          </h2>
          <p className="card-desc">
            {t("advisoryResults.weatherSource", {
              source: data.weather.source,
              humidity: data.weather.relative_humidity_pct,
            })}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(18, 63, 54, 0.12)" />
            <XAxis dataKey="date" stroke="#123F36" tick={{ fill: "#000000", fontSize: 11 }} />
            <YAxis stroke="#123F36" tick={{ fill: "#000000", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#F5EBDD",
                border: "1px solid #123F36",
                color: "#000000",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
            />
            <Line type="monotone" dataKey="max" stroke="#000000" strokeWidth={2} name={t("advisoryResults.maxTemp")} dot={false} />
            <Line type="monotone" dataKey="min" stroke="#486960" strokeWidth={2} name={t("advisoryResults.minTemp")} dot={false} />
            <Line type="monotone" dataKey="rain" stroke="#123F36" strokeWidth={2.5} name={t("advisoryResults.rain")} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>
            <SatelliteIcon width="18" height="18" />
            {t("advisoryResults.climateHeading")}
          </h2>
          <p className="card-desc">
            {t("advisoryResults.climateSource", { source: data.climate.source, period: data.climate.period })}
          </p>
        </div>
        <div className="stat-grid">
          <div className="stat-widget">
            <span className="stat-widget-icon"><ThermometerIcon width="16" height="16" /></span>
            <span className="stat-label">{t("advisoryResults.avgTemperature")}</span>
            <span className="stat-value">{data.climate.avg_temperature_c ?? "-"}&deg;C</span>
          </div>
          <div className="stat-widget">
            <span className="stat-widget-icon"><DropletIcon width="16" height="16" /></span>
            <span className="stat-label">{t("advisoryResults.avgPrecipitation")}</span>
            <span className="stat-value">{data.climate.avg_precipitation_mm_day ?? "-"} mm</span>
          </div>
          <div className="stat-widget">
            <span className="stat-widget-icon"><SunIcon width="16" height="16" /></span>
            <span className="stat-label">{t("advisoryResults.solarRadiation")}</span>
            <span className="stat-value">{data.climate.solar_radiation_kwh_m2 ?? "-"} kWh/m&sup2;</span>
          </div>
          <div className="stat-widget">
            <span className="stat-widget-icon"><SatelliteIcon width="16" height="16" /></span>
            <span className="stat-label">{t("advisoryResults.soilMoisture")}</span>
            <span className="stat-value">{data.climate.soil_moisture_proxy_pct ?? "-"}%</span>
          </div>
        </div>
      </div>

      <div className="card span-2">
        <div className="card-header">
          <h2>
            <CheckCircleIcon width="18" height="18" />
            {t("advisoryResults.regenerativeHeading")}
          </h2>
          <p className="card-desc">Explainable, rule-based interventions mapped to your farm's deficiencies.</p>
        </div>
        <ul className="practice-list">
          {data.regenerative_practices.map((p, i) => (
            <li key={i} className={`practice-card priority-${p.priority}`}>
              <div className="practice-head">
                <strong style={{ fontSize: "0.9375rem" }}>{p.practice}</strong>
                <span className="badge">{t(`advisoryResults.priority.${p.priority}`)}</span>
              </div>
              <p className="card-desc" style={{ marginTop: "6px" }}>{p.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
