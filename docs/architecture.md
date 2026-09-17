# AgriNexus — Architecture

## Problem being solved (Track 4 — AgriN & Regenerative Agricultural Intelligence)

Small and marginal farmers lack access to data-driven agricultural guidance
(satellite data, soil health analytics, climate forecasting), which leads to
crop failure and threatens food security. There is also no shared digital
infrastructure for BRICS nations to cooperate on climate-resilient farming.

## Solution shape

```
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
- Federation store is in-memory (resets on backend restart) — a production
  version would use a shared database with per-node row-level access control.
