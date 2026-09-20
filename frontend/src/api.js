const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8123/api/v1";
const FEDERATION_API_KEY = import.meta.env.VITE_FEDERATION_API_KEY || "";

// Only sent on federation writes, and only when set -- see the backend's
// FEDERATION_API_KEY: this is a shared demo-mode secret, not per-node auth.
function federationWriteHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (FEDERATION_API_KEY) headers["X-API-Key"] = FEDERATION_API_KEY;
  return headers;
}

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchAdvisory(payload) {
  const res = await fetch(`${API_URL}/advisory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function geocodePlace(query) {
  const res = await fetch(`${API_URL}/advisory/geocode?query=${encodeURIComponent(query)}`);
  return handle(res);
}

export async function diagnoseDisease(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/disease/diagnose`, { method: "POST", body: formData });
  return handle(res);
}

export async function fetchFederationStats() {
  const res = await fetch(`${API_URL}/federation/stats`);
  return handle(res);
}

export async function fetchFederationNodes() {
  const res = await fetch(`${API_URL}/federation/nodes`);
  return handle(res);
}

export async function fetchFederationInsights() {
  const res = await fetch(`${API_URL}/federation/insights`);
  return handle(res);
}

export async function registerFederationNode(node) {
  const res = await fetch(`${API_URL}/federation/nodes`, {
    method: "POST",
    headers: federationWriteHeaders(),
    body: JSON.stringify(node),
  });
  return handle(res);
}

export async function submitFederationInsight(insight) {
  const res = await fetch(`${API_URL}/federation/insights`, {
    method: "POST",
    headers: federationWriteHeaders(),
    body: JSON.stringify(insight),
  });
  return handle(res);
}
