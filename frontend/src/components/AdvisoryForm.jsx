import { useState } from "react";
import { geocodePlace } from "../api";
import { MapPinIcon, SearchIcon, SproutIcon, LoaderIcon } from "./Icons";

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
      <div className="card-header">
        <h2>
          <SproutIcon width="20" height="20" />
          Farm details
        </h2>
        <p className="card-desc">
          Geocode your farm coordinates and input laboratory soil test parameters.
        </p>
      </div>

      <label className="field" style={{ position: "relative" }}>
        <span>Search location</span>
        <div className="search-input-group">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Nagpur, India"
          />
          <button type="button" className="btn-outline" onClick={handleSearch} disabled={searching}>
            {searching ? <LoaderIcon width="14" height="14" /> : <SearchIcon width="14" height="14" />}
            Search
          </button>
          <button
            type="button"
            className="btn-outline btn-icon"
            onClick={useMyLocation}
            disabled={locating}
            title="Use my current location"
            aria-label="Use my current location"
          >
            {locating ? <LoaderIcon width="14" height="14" /> : <MapPinIcon width="15" height="15" />}
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s) => (
              <li key={`${s.latitude}-${s.longitude}`} onClick={() => pickSuggestion(s)}>
                <MapPinIcon width="14" height="14" style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span>{s.name}{s.admin1 ? `, ${s.admin1}` : ""}{s.country ? `, ${s.country}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
        {locateError && <span className="field-error">{locateError}</span>}
      </label>

      <div className="grid-4">
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
      <div className="grid-3">
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
        <label className="field checkbox-field" style={{ alignSelf: "center", paddingTop: "14px" }}>
          <input
            type="checkbox"
            checked={form.irrigation_available}
            onChange={update("irrigation_available")}
          />
          <span>Irrigation available</span>
        </label>
      </div>

      <button type="submit" className="primary" disabled={loading} style={{ marginTop: "14px" }}>
        {loading ? (
          <>
            <LoaderIcon width="16" height="16" />
            <span>Fetching advisory...</span>
          </>
        ) : (
          <>
            <SproutIcon width="16" height="16" />
            <span>Get regenerative advisory</span>
          </>
        )}
      </button>
    </form>
  );
}
