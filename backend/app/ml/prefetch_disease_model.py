"""Pre-download the disease-classifier weights at image build time.

Run standalone: python -m app.ml.prefetch_disease_model

Without this, the first `/disease/diagnose` request in a fresh container
would pay for the ~9MB Hugging Face download itself, which is slow and
makes that first request fail if the container has no outbound network
access. Baking the weights into the image keeps the container self
contained after build, same as the crop model's `train_crop_model.py`.
"""
from __future__ import annotations

from app.services.disease_model import MODEL_ID, _get_pipeline


def prefetch() -> None:
    print(f"Downloading disease classifier weights: {MODEL_ID}")
    _get_pipeline()
    print("Done.")


if __name__ == "__main__":
    prefetch()
