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

function validate(form) {
  const errors = {};
  const num = (v) => (v === "" || v === null ? NaN : parseFloat(v));

  const lat = num(form.latitude);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.latitude = "Must be between -90 and 90";

  const lon = num(form.longitude);
  if (Number.isNaN(lon) || lon < -180 || lon > 180) errors.longitude = "Must be between -180 and 180";

  for (const [key, label] of [
    ["nitrogen", "Nitrogen"],
    ["phosphorus", "Phosphorus"],
    ["potassium", "Potassium"],
  ]) {
    const v = num(form[key]);
    if (Number.isNaN(v) || v < 0 || v > 300) errors[key] = `${label} must be between 0 and 300 kg/ha`;
  }

  const ph = num(form.ph);
  if (Number.isNaN(ph) || ph < 0 || ph > 14) errors.ph = "pH must be between 0 and 14";

  if (form.organic_carbon_pct !== "" && form.organic_carbon_pct !== null) {
    const oc = num(form.organic_carbon_pct);
    if (Number.isNaN(oc) || oc < 0 || oc > 20) errors.organic_carbon_pct = "Must be between 0 and 20%";
  }

  return errors;
}

export default function AdvisoryForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULTS);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setLocateError(null);
    try {
      const results = await geocodePlace(search.trim());
      setSuggestions(results);
      if (results.length === 0) setLocateError(`No matches for "${search.trim()}"`);
    } catch (err) {
      setSuggestions([]);
      setLocateError(err.message || "Location search failed");
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
    setLocateError(null);
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation is not available in this browser");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }));
        setLocating(false);
      },
      (err) => {
        setLocateError(err.message || "Could not get your location");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
        organic_carbon_pct:
          form.organic_carbon_pct === "" ? null : parseFloat(form.organic_carbon_pct),
      },
      current_crop: form.current_crop || null,
      irrigation_available: Boolean(form.irrigation_available),
    });
  };

  const fieldError = (key) => touched && errors[key];

  return (
    <form className="card form-card" onSubmit={submit} noValidate>
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
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            title="Use my current location"
          >
            {locating ? "..." : "📍"}
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
        {locateError && <span className="field-error">{locateError}</span>}
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
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={update("latitude")}
            aria-invalid={Boolean(fieldError("latitude"))}
          />
          {fieldError("latitude") && <span className="field-error">{errors.latitude}</span>}
        </label>
        <label className="field">
          <span>Longitude</span>
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={update("longitude")}
            aria-invalid={Boolean(fieldError("longitude"))}
          />
          {fieldError("longitude") && <span className="field-error">{errors.longitude}</span>}
        </label>
      </div>

      <h3>Soil test (kg/ha, pH)</h3>
      <div className="grid-2">
        <label className="field">
          <span>Nitrogen (N)</span>
          <input
            type="number"
            step="any"
            value={form.nitrogen}
            onChange={update("nitrogen")}
            aria-invalid={Boolean(fieldError("nitrogen"))}
          />
          {fieldError("nitrogen") && <span className="field-error">{errors.nitrogen}</span>}
        </label>
        <label className="field">
          <span>Phosphorus (P)</span>
          <input
            type="number"
            step="any"
            value={form.phosphorus}
            onChange={update("phosphorus")}
            aria-invalid={Boolean(fieldError("phosphorus"))}
          />
          {fieldError("phosphorus") && <span className="field-error">{errors.phosphorus}</span>}
        </label>
        <label className="field">
          <span>Potassium (K)</span>
          <input
            type="number"
            step="any"
            value={form.potassium}
            onChange={update("potassium")}
            aria-invalid={Boolean(fieldError("potassium"))}
          />
          {fieldError("potassium") && <span className="field-error">{errors.potassium}</span>}
        </label>
        <label className="field">
          <span>pH</span>
          <input
            type="number"
            step="any"
            value={form.ph}
            onChange={update("ph")}
            aria-invalid={Boolean(fieldError("ph"))}
          />
          {fieldError("ph") && <span className="field-error">{errors.ph}</span>}
        </label>
        <label className="field">
          <span>Organic carbon %</span>
          <input
            type="number"
            step="any"
            value={form.organic_carbon_pct}
            onChange={update("organic_carbon_pct")}
            aria-invalid={Boolean(fieldError("organic_carbon_pct"))}
          />
          {fieldError("organic_carbon_pct") && (
            <span className="field-error">{errors.organic_carbon_pct}</span>
          )}
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
