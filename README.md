# AgriNexus

**Open regenerative-agriculture intelligence for BRICS cooperation.**

Built for Hack2Skill's *Build with AI: Code for Communities* — **Track 4:
AgriN & Regenerative Agricultural Intelligence** (BRICS theme: Cooperation).
Prototype submission deadline: **30 Sep 2026**.

## The problem

Small and marginal farmers across emerging economies lack access to
data-driven agricultural guidance — satellite data, soil health analytics,
and climate forecasting — relying instead on traditional methods, which
leads to crop failure and threatens food security. The absence of shared
digital infrastructure also blocks cross-border collaboration on
climate-resilient farming.

## What AgriNexus does

1. **Real-time, localized agro-advisories** combining live weather
   (Open-Meteo) and live satellite-derived agro-climatology (NASA POWER —
   solar radiation, precipitation, root-zone soil moisture).
2. **Regenerative crop recommendations** from a soil-test-driven ML model,
   paired with an explainable regenerative-practice engine (legume rotation,
   cover cropping, compost/no-till, lime/gypsum correction, water
   conservation).
3. **A crop leaf disease diagnostic tool** — photo upload → a trained
   MobileNetV2 classifier (38 diseases across 14 crops, PlantVillage-based)
   with an explainable CV-heuristic fallback if the model is unavailable.
4. **A BRICS cooperation / federation layer** — the actual differentiator:
   an open schema and API letting regional nodes across BRICS countries
   share aggregated, anonymized soil-health and best-practice signals,
   turning this from a single-country app into shared digital public-good
   infrastructure.
5. **A multi-language UI** — English, हिन्दी, Português, Русский and 中文
   (the most-used BRICS languages; South Africa is commonly served in
   English alongside its 11 other official languages, so it isn't broken
   out separately). Scope, stated honestly: this localizes UI chrome
   (labels, buttons, validation messages) — it does not localize content
   the backend generates dynamically (crop names, advisory rationale,
   regenerative-practice text), which would need server-side i18n or a
   translation API. See `frontend/src/i18n/translations.js`.

See [`docs/architecture.md`](docs/architecture.md) for the full design
rationale and stated limitations, and [`docs/demo_script.md`](docs/demo_script.md)
for a 3-minute walkthrough.

## Stack

- **Backend**: FastAPI (Python 3.12), scikit-learn, OpenCV,
  transformers/torch (CPU-only), httpx
- **Frontend**: React + Vite, Recharts
- **Data**: Open-Meteo (weather), NASA POWER (satellite/reanalysis
  agro-climatology) — both free and keyless; a real published crop
  recommendation dataset (see [`backend/app/ml/real_data/SOURCE.md`](backend/app/ml/real_data/SOURCE.md));
  a public pretrained plant-disease classifier from Hugging Face
- No GPU or model training on our side required; the crop model trains in
  seconds on CPU, and the disease classifier is a pretrained checkpoint we
  run for inference, not something we trained ourselves
  on CPU.

## Running locally

### Backend

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.ml.train_crop_model   # trains the crop model (few seconds, CPU only)
uvicorn app.main:app --reload --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev
```

App: `http://127.0.0.1:5173`

### Docker (both services)

```bash
docker compose up --build
```

Frontend: `http://localhost:3000` &middot; Backend: `http://localhost:8010`
(mapped to 8010 on the host to avoid clashing with anything else already
using 8000 — the container itself still listens on 8000 internally).

### Tests

```bash
# backend: 93 tests (pytest + respx mocking the external APIs; the CNN
# disease classifier is tested via dependency injection, no network/model
# download needed)
cd backend && source .venv/bin/activate && pytest

# frontend: 48 tests (Vitest + Testing Library), including a translation
# completeness check across all 5 languages
cd frontend && npm test
```

Two manual, network-dependent checks aren't part of the above (by design,
so the main suite stays fast and deterministic):

- `frontend/e2e/smoke.mjs` — drives a real Chrome instance through all
  three tabs against the live dev servers and screenshots each state.
- `backend/scripts/verify_disease_model.py` — downloads the real disease
  classifier and a real CC-licensed photo of tomato late blight, and checks
  the model actually identifies it. Run it (from `backend/`, venv active)
  after touching `disease_model.py` to sanity-check the real model, not
  just its mocked tests.

## API overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/advisory` | POST | Full advisory: crop recommendations, weather, climate, regenerative practices |
| `/api/v1/advisory/geocode` | GET | Place-name → lat/lon lookup |
| `/api/v1/disease/diagnose` | POST | Upload a leaf photo, get a stress diagnosis |
| `/api/v1/federation/nodes` | GET/POST | Register/list BRICS cooperation nodes |
| `/api/v1/federation/insights` | GET/POST | Publish/list aggregated regional insights |
| `/api/v1/federation/stats` | GET | Network-wide cooperation stats |

Full request/response schemas are in `backend/app/models/schemas.py` and are
also auto-documented at `/docs`.

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | frontend | `http://127.0.0.1:8123/api/v1` | Base URL the frontend calls |
| `LOG_LEVEL` | backend | `INFO` | stdlib logging level (`DEBUG`, `INFO`, `WARNING`, ...) |
| `RATE_LIMIT_ENABLED` | backend | `true` | Toggle the per-IP rate limiter |
| `RATE_LIMIT_REQUESTS` | backend | `120` | Max requests per client IP per window |
| `RATE_LIMIT_WINDOW_SECONDS` | backend | `60` | Rate limit window, in seconds |
| `FEDERATION_API_KEY` | backend | *(unset)* | If set, requires a matching `X-API-Key` header on `POST /federation/*`. Unset = open writes (demo mode). |
| `VITE_FEDERATION_API_KEY` | frontend | *(unset)* | Set to the same value as `FEDERATION_API_KEY` so the app's own federation forms keep working when auth is enabled |

No API keys are required to run this — Open-Meteo and NASA POWER (the
external data sources) are both free and keyless. `FEDERATION_API_KEY` is
an *optional* app-level control you can turn on, not a required credential.

## Repository layout

```text
backend/    FastAPI app, ML training script, services, tests
frontend/   React (Vite) dashboard
docs/       Architecture, federation schema, demo script
```

## Roadmap / known limitations (stated honestly, not hidden)

- The crop recommendation model trains on a **real, published dataset**
  (Kaggle "Crop Recommendation Dataset", 2,200 rows, 22 crops — see
  `backend/app/ml/real_data/SOURCE.md` for provenance and a license
  caveat) — but it's a generic dataset, not regional data for the specific
  BRICS geographies this project targets. The synthetic generator
  (`generate_dataset.py`) remains as a documented automatic fallback if
  the real CSV is ever missing.
- Disease detection uses a **real trained MobileNetV2 classifier**
  (38 diseases, 14 crops, fine-tuned on PlantVillage — see
  `docs/architecture.md` for how it was verified, including a real CC-licensed
  test photo) with the original OpenCV heuristic (`disease_detector.py`) as
  an automatic fallback if the model can't load. It works best on
  close-up single-leaf photos, not arbitrary field framing — the UI says so.
- The federation store is **SQLite** (one file, persisted via a Docker
  volume) — it survives restarts but has no per-node access control;
  production would move to Postgres with row-level tenancy.
- The **multi-language UI** covers static labels/buttons/validation text
  in 5 languages, but backend-generated content (crop names, advisory
  rationale, regenerative-practice descriptions) stays in English — that
  would need server-side i18n or a translation API to close.
- **Federation writes are gated by one shared secret**, not per-node
  credentials (`FEDERATION_API_KEY`, off by default). It stops drive-by
  abuse of a public URL; it doesn't give per-node attribution or
  revocation. A production version would issue each participating node
  its own key.
- **Rate limiting is in-memory and per-process** (fine for the single
  backend container this ships as; a multi-instance deployment would need
  it backed by Redis instead, same as the response cache).

## License

MIT — see [LICENSE](LICENSE).
