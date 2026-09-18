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
                         │    ├─ crop_recommender    │  (RandomForest, trained offline)
                         │    └─ regenerative_engine │  (explainable rule engine)
                         │                           │
                         │  /disease/diagnose        │  (OpenCV leaf-stress heuristic)
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

- **Crop recommendation model**: a scikit-learn RandomForest trained on a
  small tabular dataset seeded from published agronomic requirement ranges
  per crop (see `backend/app/ml/generate_dataset.py` docstring for the
  explicit limitation and the upgrade path to a real regional dataset, ideally
  contributed via the federation API itself).

- **Regenerative practice engine**: deterministic, explainable rules
  (legume rotation for low N, compost/no-till for low organic carbon, lime/
  gypsum for pH extremes, mulching/water harvesting for low
  precipitation/soil moisture) rather than an opaque model — this matters for
  farmer trust and for judges checking "why did it say this."

- **Leaf diagnostics**: an OpenCV color-space heuristic (healthy green vs.
  chlorotic/necrotic tissue ratio), not a trained CNN. No labeled disease
  image dataset or GPU was available in this environment. It's honestly
  labeled `opencv-heuristic-v1` end-to-end (API + UI) with a documented
  upgrade path to a MobileNetV2/EfficientNet model trained on PlantVillage or
  on images collected through the federation network — swapping in a real
  model only touches `disease_detector.py`, not the API contract.

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

## Known limitations (stated up front for judges)

- Crop model is trained on a synthetic seed dataset, not field records.
- Disease detection is a heuristic, not a trained classifier.
- Federation store is SQLite (a single file at
  `backend/app/data/federation/federation.db`, persisted via a Docker
  volume) — this survives restarts, unlike the original in-memory version,
  but it's still one file with no per-node access control. A production
  version would move to Postgres with row-level tenancy so one node can't
  overwrite another's data.
