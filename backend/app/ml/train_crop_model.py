"""Train the crop recommendation RandomForest and persist it with joblib.

Usage: python -m app.ml.train_crop_model
Runs in a couple of seconds on CPU; no GPU required.

Trains on the real "Crop Recommendation Dataset" (Kaggle, Atharva Ingle;
see app/ml/real_data/SOURCE.md for provenance/license notes) when that file
is present in the repo. Falls back to the synthetic, agronomic-range-seeded
dataset from generate_dataset.py only if the real CSV is missing -- e.g. a
shallow checkout that dropped it, or a from-scratch environment that hasn't
pulled real_data/ yet. The fallback exists so `train()` never hard-fails.
"""
from __future__ import annotations

import pathlib

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from app.ml.generate_dataset import generate

FEATURES = ["nitrogen", "phosphorus", "potassium", "temperature", "humidity", "ph", "rainfall"]
MODEL_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "crop_model.joblib"
DATASET_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "crop_dataset.csv"
REAL_DATASET_PATH = pathlib.Path(__file__).resolve().parent / "real_data" / "crop_recommendation.csv"

_COLUMN_RENAME = {"N": "nitrogen", "P": "phosphorus", "K": "potassium"}


def load_real_dataset() -> pd.DataFrame | None:
    if not REAL_DATASET_PATH.exists():
        return None
    df = pd.read_csv(REAL_DATASET_PATH)
    df = df.rename(columns=_COLUMN_RENAME)
    return df[FEATURES + ["label"]]


def train() -> None:
    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)

    df = load_real_dataset()
    if df is not None:
        source = "real:kaggle-crop-recommendation-dataset"
    else:
        print("Real dataset not found; falling back to the synthetic seed dataset.")
        df = generate()
        source = "synthetic:agronomic-range-seed"

    df.to_csv(DATASET_PATH, index=False)

    X = df[FEATURES]
    y = df["label"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    acc = accuracy_score(y_test, clf.predict(X_test))
    print(f"Trained on {source} ({len(df)} rows, {y.nunique()} crops). Hold-out accuracy: {acc:.3f}")

    joblib.dump({"model": clf, "features": FEATURES, "dataset_source": source}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
