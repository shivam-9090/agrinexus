import { useState } from "react";
import { geocodePlace } from "../api";
import { useLanguage } from "../i18n/LanguageContext";

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

function validate(form, t) {
  const errors = {};
  const num = (v) => (v === "" || v === null ? NaN : parseFloat(v));

  const lat = num(form.latitude);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.latitude = t("advisoryForm.errorLatitudeRange");

  const lon = num(form.longitude);
  if (Number.isNaN(lon) || lon < -180 || lon > 180) errors.longitude = t("advisoryForm.errorLongitudeRange");

  for (const [key, labelKey] of [
    ["nitrogen", "advisoryForm.nitrogenLabel"],
    ["phosphorus", "advisoryForm.phosphorusLabel"],
    ["potassium", "advisoryForm.potassiumLabel"],
  ]) {
    const v = num(form[key]);
    if (Number.isNaN(v) || v < 0 || v > 300) {
      errors[key] = t("advisoryForm.errorNutrientRange", { label: t(labelKey) });
    }
  }

  const ph = num(form.ph);
  if (Number.isNaN(ph) || ph < 0 || ph > 14) errors.ph = t("advisoryForm.errorPhRange");

  if (form.organic_carbon_pct !== "" && form.organic_carbon_pct !== null) {
    const oc = num(form.organic_carbon_pct);
    if (Number.isNaN(oc) || oc < 0 || oc > 20) errors.organic_carbon_pct = t("advisoryForm.errorOrganicCarbonRange");
  }

  return errors;
}

export default function AdvisoryForm({ onSubmit, loading }) {
  const { t } = useLanguage();
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
      if (results.length === 0) setLocateError(t("advisoryForm.noMatches", { query: search.trim() }));
    } catch (err) {
      setSuggestions([]);
      setLocateError(err.message || t("advisoryForm.locationSearchFailed"));
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
      setLocateError(t("advisoryForm.geolocationUnavailable"));
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
        setLocateError(err.message || t("advisoryForm.couldNotGetLocation"));
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    const validationErrors = validate(form, t);
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
      <h2>{t("advisoryForm.heading")}</h2>

      <label className="field">
        <span>{t("advisoryForm.searchLocation")}</span>
        <div className="search-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("advisoryForm.searchPlaceholder")}
          />
          <button type="button" onClick={handleSearch} disabled={searching}>
            {searching ? "..." : t("advisoryForm.search")}
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            title={t("advisoryForm.useMyLocation")}
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
          <span>{t("advisoryForm.placeName")}</span>
          <input value={form.place_name} onChange={update("place_name")} />
        </label>
        <label className="field">
          <span>{t("advisoryForm.currentCrop")}</span>
          <input value={form.current_crop} onChange={update("current_crop")} />
        </label>
        <label className="field">
          <span>{t("advisoryForm.latitude")}</span>
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
          <span>{t("advisoryForm.longitude")}</span>
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

      <h3>{t("advisoryForm.soilHeading")}</h3>
      <div className="grid-2">
        <label className="field">
          <span>{t("advisoryForm.nitrogen")}</span>
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
          <span>{t("advisoryForm.phosphorus")}</span>
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
          <span>{t("advisoryForm.potassium")}</span>
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
          <span>{t("advisoryForm.ph")}</span>
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
          <span>{t("advisoryForm.organicCarbon")}</span>
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
          <span>{t("advisoryForm.irrigationAvailable")}</span>
        </label>
      </div>

      <button type="submit" className="primary" disabled={loading}>
        {loading ? t("advisoryForm.submitting") : t("advisoryForm.submit")}
      </button>
    </form>
  );
}
