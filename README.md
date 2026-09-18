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
3. **A crop leaf stress/disease diagnostic tool** (photo upload → instant
   heuristic diagnosis + recommended action).
4. **A BRICS cooperation / federation layer** — the actual differentiator:
   an open schema and API letting regional nodes across BRICS countries
   share aggregated, anonymized soil-health and best-practice signals,
   turning this from a single-country app into shared digital public-good
   infrastructure.

See [`docs/architecture.md`](docs/architecture.md) for the full design
rationale and stated limitations, and [`docs/demo_script.md`](docs/demo_script.md)
for a 3-minute walkthrough.

## Stack

- **Backend**: FastAPI (Python 3.12), scikit-learn, OpenCV, httpx
- **Frontend**: React + Vite, Recharts
- **Data**: Open-Meteo (weather), NASA POWER (satellite/reanalysis
  agro-climatology) — both free and keyless
- No GPU or heavy model training required; the crop model trains in seconds
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
# backend: 44 tests (pytest + respx mocking the external APIs)
cd backend && source .venv/bin/activate && pytest

# frontend: component/unit tests (Vitest + Testing Library)
cd frontend && npm test
```

There's also a manual browser smoke test (`frontend/e2e/smoke.mjs`) that
drives a real Chrome instance through all three tabs against the live dev
servers and screenshots each state — see the comment at the top of that file
for how to run it. It's not part of `npm test` since it needs a running
backend/frontend and a local Chrome install.

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

No API keys are required — Open-Meteo and NASA POWER are both free and
keyless.

## Repository layout

```text
backend/    FastAPI app, ML training script, services, tests
frontend/   React (Vite) dashboard
docs/       Architecture, federation schema, demo script
```

## Roadmap / known limitations (stated honestly, not hidden)

- The crop recommendation model is trained on a **synthetic seed dataset**
  built from published agronomic ranges, not field records — see
  `backend/app/ml/generate_dataset.py`. Swapping in a real regional dataset
  (ideally sourced through the federation API) is a drop-in change.
- Disease detection is a **CV heuristic (v1)**, not a trained CNN — no
  labeled dataset or GPU was available in this build window. Upgrade path to
  a fine-tuned MobileNetV2/EfficientNet model is documented in
  `disease_detector.py` and sits behind the same function signature.
- The federation store is **SQLite** (one file, persisted via a Docker
  volume) — it survives restarts but has no per-node access control;
  production would move to Postgres with row-level tenancy.

## License

MIT — see [LICENSE](LICENSE).
