import { useState } from "react";
import { geocodePlace } from "../api";

const DEFAULTS = {
  place_name: "Nagpur, India",
  latitude: 21.1458,
  longitude: 79.0882,
  nitrogen: 60,
  phosphorus: 30,
  potassium: 30,
  ph: 6.5,
  organic_carbon_pct: 0.6,
  current_crop: "cotton",
  irrigation_available: false,
};

export default function AdvisoryForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULTS);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const results = await geocodePlace(search.trim());
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const pickSuggestion = (result) => {
    setForm((f) => ({
      ...f,
      place_name: `${result.name}${result.country ? ", " + result.country : ""}`,
      latitude: result.latitude,
      longitude: result.longitude,
    }));
    setSuggestions([]);
    setSearch("");
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      location: {
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        place_name: form.place_name,
      },
      soil: {
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        ph: parseFloat(form.ph),
        organic_carbon_pct: parseFloat(form.organic_carbon_pct),
      },
      current_crop: form.current_crop || null,
      irrigation_available: Boolean(form.irrigation_available),
    });
  };

  return (
    <form className="card form-card" onSubmit={submit}>
      <h2>Farm details</h2>

      <label className="field">
        <span>Search location</span>
        <div className="search-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Nagpur, India"
          />
          <button type="button" onClick={handleSearch} disabled={searching}>
            {searching ? "..." : "Search"}
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s) => (
              <li key={`${s.latitude}-${s.longitude}`} onClick={() => pickSuggestion(s)}>
                {s.name}{s.admin1 ? `, ${s.admin1}` : ""}{s.country ? `, ${s.country}` : ""}
              </li>
            ))}
          </ul>
        )}
      </label>

      <div className="grid-2">
        <label className="field">
          <span>Place name</span>
          <input value={form.place_name} onChange={update("place_name")} />
        </label>
        <label className="field">
          <span>Current / previous crop</span>
          <input value={form.current_crop} onChange={update("current_crop")} />
        </label>
        <label className="field">
          <span>Latitude</span>
          <input type="number" step="any" value={form.latitude} onChange={update("latitude")} required />
        </label>
        <label className="field">
          <span>Longitude</span>
          <input type="number" step="any" value={form.longitude} onChange={update("longitude")} required />
        </label>
      </div>

      <h3>Soil test (kg/ha, pH)</h3>
      <div className="grid-2">
        <label className="field">
          <span>Nitrogen (N)</span>
          <input type="number" step="any" value={form.nitrogen} onChange={update("nitrogen")} required />
        </label>
        <label className="field">
          <span>Phosphorus (P)</span>
          <input type="number" step="any" value={form.phosphorus} onChange={update("phosphorus")} required />
        </label>
        <label className="field">
          <span>Potassium (K)</span>
          <input type="number" step="any" value={form.potassium} onChange={update("potassium")} required />
        </label>
        <label className="field">
          <span>pH</span>
          <input type="number" step="any" value={form.ph} onChange={update("ph")} required />
        </label>
        <label className="field">
          <span>Organic carbon %</span>
          <input type="number" step="any" value={form.organic_carbon_pct} onChange={update("organic_carbon_pct")} />
        </label>
        <label className="field checkbox-field">
          <input type="checkbox" checked={form.irrigation_available} onChange={update("irrigation_available")} />
          <span>Irrigation available</span>
        </label>
      </div>

      <button type="submit" className="primary" disabled={loading}>
        {loading ? "Fetching advisory..." : "Get regenerative advisory"}
      </button>
    </form>
  );
}
