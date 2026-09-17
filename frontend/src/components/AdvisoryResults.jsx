import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIORITY_LABEL = { high: "High priority", medium: "Medium priority", low: "Low priority" };

export default function AdvisoryResults({ data }) {
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
        <h2>Soil health score</h2>
        <div className="score-ring" style={{ "--score": data.soil_health_score }}>
          <span>{data.soil_health_score}</span>
        </div>
        <p className="muted">Composite of N-P-K balance, pH and organic carbon for {data.location.place_name}.</p>
      </div>

      <div className="card">
        <h2>Recommended crops</h2>
        <ol className="crop-list">
          {data.crop_recommendations.map((c) => (
            <li key={c.crop}>
              <div className="crop-head">
                <strong>{c.crop}</strong>
                <span>{Math.round(c.confidence * 100)}%</span>
              </div>
              <p className="muted small">{c.rationale}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>7-day weather forecast</h2>
        <p className="muted small">Source: {data.weather.source} &middot; humidity {data.weather.relative_humidity_pct}%</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2c3b2c" />
            <XAxis dataKey="date" stroke="#8fae8f" fontSize={12} />
            <YAxis stroke="#8fae8f" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1b2a1b", border: "1px solid #3a5a3a" }} />
            <Line type="monotone" dataKey="max" stroke="#f2a154" name="Max C" dot={false} />
            <Line type="monotone" dataKey="min" stroke="#5aa0f2" name="Min C" dot={false} />
            <Line type="monotone" dataKey="rain" stroke="#7fd17f" name="Rain mm" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Satellite agro-climatology</h2>
        <p className="muted small">Source: {data.climate.source} &middot; {data.climate.period}</p>
        <div className="stat-grid">
          <div>
            <span className="stat-value">{data.climate.avg_temperature_c ?? "-"}&deg;C</span>
            <span className="stat-label">Avg temperature</span>
          </div>
          <div>
            <span className="stat-value">{data.climate.avg_precipitation_mm_day ?? "-"} mm</span>
            <span className="stat-label">Avg daily precipitation</span>
          </div>
          <div>
            <span className="stat-value">{data.climate.solar_radiation_kwh_m2 ?? "-"} kWh/m&sup2;</span>
            <span className="stat-label">Solar radiation</span>
          </div>
          <div>
            <span className="stat-value">{data.climate.soil_moisture_proxy_pct ?? "-"}%</span>
            <span className="stat-label">Root-zone soil moisture</span>
          </div>
        </div>
      </div>

      <div className="card span-2">
        <h2>Regenerative practice recommendations</h2>
        <ul className="practice-list">
          {data.regenerative_practices.map((p, i) => (
            <li key={i} className={`priority-${p.priority}`}>
              <div className="practice-head">
                <strong>{p.practice}</strong>
                <span className="badge">{PRIORITY_LABEL[p.priority]}</span>
              </div>
              <p className="muted small">{p.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
