"""Train the crop recommendation RandomForest and persist it with joblib.

Usage: python -m app.ml.train_crop_model
Runs in a couple of seconds on CPU; no GPU required.
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


def train() -> None:
    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    df = generate()
    df.to_csv(DATASET_PATH, index=False)

    X = df[FEATURES]
    y = df["label"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    acc = accuracy_score(y_test, clf.predict(X_test))
    print(f"Hold-out accuracy on synthetic seed data: {acc:.3f}")

    joblib.dump({"model": clf, "features": FEATURES}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
