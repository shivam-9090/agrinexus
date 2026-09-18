"""Disease-diagnosis entry point: trained CNN first, OpenCV heuristic as fallback.

Kept as a thin orchestrator over the two implementations (disease_model,
disease_detector) rather than merging them, so each stays independently
testable -- disease_model tests inject a fake classifier and never touch
the network; disease_detector's heuristic tests are untouched from before
this file existed.

The fallback matters in practice, not just in theory: the classifier needs
`transformers`/`torch` importable and (on first call) a network path to
Hugging Face to download ~9MB of weights. If either is unavailable --
offline dev environment, first request racing a slow download, model repo
temporarily down -- a farmer still gets a heuristic answer instead of a
500.
"""
from __future__ import annotations

import logging

from app.models.schemas import DiseaseDiagnosis
from app.services import disease_detector, disease_model

logger = logging.getLogger("app.disease_service")


def diagnose(image_bytes: bytes) -> DiseaseDiagnosis:
    try:
        return disease_model.diagnose_with_model(image_bytes)
    except Exception as exc:
        logger.warning("cnn_diagnosis_failed_falling_back_to_heuristic", exc_info=exc)
        return disease_detector.diagnose(image_bytes)
