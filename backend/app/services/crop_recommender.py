"""Loads the trained RandomForest crop model and produces ranked recommendations."""
from __future__ import annotations

import pathlib
import threading

import joblib
import pandas as pd

from app.models.schemas import CropRecommendation

_MODEL_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "crop_model.joblib"
_lock = threading.Lock()
_cache: dict | None = None


def _load():
    global _cache
    if _cache is None:
        with _lock:
            if _cache is None:
                if not _MODEL_PATH.exists():
                    from app.ml.train_crop_model import train

                    train()
                _cache = joblib.load(_MODEL_PATH)
    return _cache


def recommend_crops(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    ph: float,
    temperature: float,
    humidity: float,
    rainfall: float,
    top_k: int = 3,
) -> list[CropRecommendation]:
    bundle = _load()
    model = bundle["model"]
    features = bundle["features"]

    row = pd.DataFrame(
        [
            {
                "nitrogen": nitrogen,
                "phosphorus": phosphorus,
                "potassium": potassium,
                "temperature": temperature,
                "humidity": humidity,
                "ph": ph,
                "rainfall": rainfall,
            }
        ]
    )[features]

    proba = model.predict_proba(row)[0]
    classes = model.classes_
    ranked = sorted(zip(classes, proba), key=lambda x: x[1], reverse=True)[:top_k]

    results = []
    for crop, confidence in ranked:
        rationale = (
            f"Matches typical {crop} requirements for the given soil N-P-K "
            f"({nitrogen:.0f}-{phosphorus:.0f}-{potassium:.0f} kg/ha), pH {ph:.1f}, "
            f"~{temperature:.1f}C and {rainfall:.0f}mm rainfall regime."
        )
        results.append(CropRecommendation(crop=crop, confidence=round(float(confidence), 3), rationale=rationale))
    return results
