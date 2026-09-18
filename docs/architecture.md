# AgriNexus — Architecture

## Problem being solved (Track 4 — AgriN & Regenerative Agricultural Intelligence)

Small and marginal farmers lack access to data-driven agricultural guidance
(satellite data, soil health analytics, climate forecasting), which leads to
crop failure and threatens food security. There is also no shared digital
infrastructure for BRICS nations to cooperate on climate-resilient farming.

## Solution shape

```text
                         ┌─────────────────────────┐
                         │        Frontend          │
                         │  React (Vite) dashboard  │
                         │  - Advisory form/results  │
                         │  - Leaf diagnostics       │
                         │  - Cooperation network    │
                         └────────────┬─────────────┘
                                      │ REST (JSON)
                         ┌────────────▼─────────────┐
                         │      FastAPI backend      │
                         │                           │
                         │  /advisory                │
                         │    ├─ weather_service   ──┼──▶ Open-Meteo API (live)
                         │    ├─ climate_service   ──┼──▶ NASA POWER API (live, satellite)
                         │    ├─ crop_recommender    │  (RandomForest, real dataset)
                         │    └─ regenerative_engine │  (explainable rule engine)
                         │                           │
                         │  /disease/diagnose        │  (trained CNN, CV heuristic fallback)
                         │                           │
                         │  /federation              │  (BRICS cooperation / digital
                         │    ├─ nodes               │   public good layer)
                         │    └─ insights            │
                         └───────────────────────────┘
```

## Why each design choice

- **Live weather (Open-Meteo) + live satellite/reanalysis climatology (NASA
  POWER)**: both are free, keyless, real data sources — no mocked numbers in
  the demo. NASA POWER supplies solar radiation, precipitation, temperature
  and root-zone soil wetness derived from NASA satellite/reanalysis products,
  which is the "satellite data" leg of the brief without requiring paid
  Sentinel Hub / Earth Engine credentials during a 12-day build.

- **Crop recommendation model**: a scikit-learn RandomForest trained on the
  real "Crop Recommendation Dataset" (Kaggle, Atharva Ingle — 2,200 rows,
  22 crops, N/P/K/temperature/humidity/pH/rainfall; provenance and license
  caveat in `backend/app/ml/real_data/SOURCE.md`). 99.3% hold-out accuracy,
  up from 94.7% on the synthetic seed data this replaced. The synthetic
  generator (`generate_dataset.py`) stays in the repo as a documented,
  automatic fallback if the real CSV is ever missing (`train_crop_model.py`
  falls back rather than hard-failing) — useful for a from-scratch
  environment with no internet access to re-fetch it. A better upgrade path
  than either is real regional data contributed via the federation API.

- **Regenerative practice engine**: deterministic, explainable rules
  (legume rotation for low N, compost/no-till for low organic carbon, lime/
  gypsum for pH extremes, mulching/water harvesting for low
  precipitation/soil moisture) rather than an opaque model — this matters for
  farmer trust and for judges checking "why did it say this."

- **Leaf diagnostics**: a trained MobileNetV2 classifier
  (`linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` on
  Hugging Face — 38 classes across 14 crops, fine-tuned on the PlantVillage
  dataset, 95.41% self-reported eval accuracy). We didn't train this
  ourselves: no labeled leaf-disease dataset or GPU was available in this
  environment, and adopting a public checkpoint with a verified accuracy
  number is more defensible than training a worse one from scratch. Verified
  before adopting it (non-gated, ~9.3MB, standard `transformers`
  architecture) and again after, by running it against a real CC-licensed
  photo of tomato late blight from Wikimedia Commons — correctly diagnosed
  at 100% confidence. One honest caveat found in that same testing: the
  model expects PlantVillage-style input (a single leaf, close-up, roughly
  plain background) — a wide garden photo of a whole plant with fruit gave
  a garbage high-confidence prediction, because that framing is out of its
  training distribution. The UI now says so. `disease_service.py` tries the
  CNN first and falls back to the original OpenCV heuristic
  (`disease_detector.py`, still labeled `opencv-heuristic-v1`) if the model
  fails to load or run — e.g. offline dev, a slow first-download racing a
  request, or the HF repo being briefly down — so a farmer gets an answer
  either way instead of a 500. `docker build` pre-downloads the weights
  (`prefetch_disease_model.py`) so the deployed container doesn't pay for
  that download on its first real request.

- **Caching**: weather/climate/geocode lookups are cached in-process per
  (rounded) coordinate (`backend/app/services/cache.py`) — 30 min for
  weather, 1 hour for the NASA POWER 30-day trailing average, 24 hours for
  geocoding. This isn't premature optimization: Open-Meteo and NASA POWER
  are free and keyless, meaning no SLA and a real risk of rate limiting if
  a judge re-submits the same location a few times during a demo. A failed
  fetch is never cached, so a transient upstream error doesn't get "stuck."

- **Structured logging**: JSON-lines logging (`backend/app/logging_config.py`)
  with one line per request (method, path, status, duration, a UUID request
  ID also echoed back as `X-Request-ID`) plus warning-level logs on
  upstream provider failures — this is the "monitoring and observability"
  slice of the brief, kept to stdlib `logging` rather than pulling in an
  APM dependency for a hackathon deployment.

- **Federation layer (the BRICS "Cooperation" hook)**: the actual
  differentiator for this theme. Regional nodes (one per BRICS country in the
  demo) register and publish only aggregated, anonymized soil-health and
  regenerative-practice signals — never individual farmer data — through the
  open schema in `docs/federation_schema.json`. This turns the app from a
  single-country tool into shared digital public-good infrastructure, which
  is explicitly what the AgriN brief asks for.

- **Multi-language UI**: a small custom React context (`frontend/src/i18n/`)
  rather than a library like `react-i18next` — five languages and a flat
  `t(key, vars)` lookup with `{placeholder}` interpolation didn't justify
  the dependency. English, हिन्दी, Português, Русский, 中文 — the most-used
  BRICS languages (South Africa is commonly served in English). The
  selected language persists in `localStorage` and is verified for
  completeness by a test that checks every language has exactly the same
  key set as English with no empty values, plus a test that every
  `{placeholder}` used in an English string also appears in every other
  language's string for that key — a translation with a missing or
  mismatched interpolation variable fails CI instead of shipping broken.
  Scope: this localizes UI chrome only, not backend-generated content
  (crop names, advisory rationale, regenerative-practice text) — see
  Known limitations below.

## Known limitations (stated up front for judges)

- Crop model is trained on a real published dataset, but a generic Indian
  one — not regional data for the specific BRICS geographies this project
  targets. The federation API is the intended path to fix that.
- Disease detection uses a real trained classifier, but one we adopted
  rather than trained ourselves, and it works best on PlantVillage-style
  close-up single-leaf photos, not arbitrary field photos — see above.
- Federation store is SQLite (a single file at
  `backend/app/data/federation/federation.db`, persisted via a Docker
  volume) — this survives restarts, unlike the original in-memory version,
  but it's still one file with no per-node access control. A production
  version would move to Postgres with row-level tenancy so one node can't
  overwrite another's data.
- The multi-language UI covers static chrome only (labels, buttons,
  validation text) in 5 languages. Content the backend generates
  dynamically — crop names, advisory rationale, regenerative-practice
  descriptions, weather/climate source strings — stays in English; closing
  that gap needs server-side i18n or a translation API, not just more
  frontend strings.
