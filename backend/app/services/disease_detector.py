"""Heuristic crop-leaf stress/disease detector using classic computer vision.

Deliberately NOT a trained CNN: no labeled disease-image dataset or GPU is
available in this environment/timeline. Color-space segmentation of leaf
tissue (healthy green vs. chlorotic/necrotic yellow-brown) is a well
established, explainable proxy for plant stress and runs instantly on CPU.

Documented upgrade path: swap this module for a MobileNetV2/EfficientNet
model fine-tuned on a labeled dataset (e.g. PlantVillage, or images collected
via the BRICS federation network) behind the same `diagnose()` interface --
no router/schema changes needed.
"""
from __future__ import annotations

import io

import cv2
import numpy as np
from PIL import Image

from app.models.schemas import DiseaseDiagnosis


def _load_bgr(image_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def diagnose(image_bytes: bytes) -> DiseaseDiagnosis:
    bgr = _load_bgr(image_bytes)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    # Healthy leaf tissue: green hues
    healthy_mask = cv2.inRange(hsv, (35, 40, 40), (90, 255, 255))
    # Chlorosis/necrosis: yellow, brown, dark-spot hues
    stressed_mask = cv2.inRange(hsv, (10, 40, 40), (34, 255, 255))
    dark_spot_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 60))

    total_pixels = bgr.shape[0] * bgr.shape[1]
    healthy_pct = 100 * cv2.countNonZero(healthy_mask) / total_pixels
    stressed_pct = 100 * (cv2.countNonZero(stressed_mask) + cv2.countNonZero(dark_spot_mask)) / total_pixels

    if stressed_pct < 5:
        level = "healthy"
        causes: list[str] = []
        action = "No visible stress detected. Continue routine monitoring."
    elif stressed_pct < 15:
        level = "mild_stress"
        causes = ["early nutrient deficiency", "minor pest activity"]
        action = "Monitor closely over the next 3-5 days; consider a foliar micronutrient spray."
    elif stressed_pct < 30:
        level = "moderate_stress"
        causes = ["fungal leaf spot", "nutrient deficiency (N/K)", "moisture stress"]
        action = "Isolate affected plants, apply an appropriate fungicide/nutrient correction, and recheck irrigation schedule."
    else:
        level = "severe_stress"
        causes = ["advanced fungal/bacterial infection", "severe nutrient deficiency", "drought stress"]
        action = "Consult a local agronomist promptly; consider removing severely affected foliage to limit spread."

    return DiseaseDiagnosis(
        stress_level=level,
        healthy_tissue_pct=round(healthy_pct, 1),
        discoloration_pct=round(stressed_pct, 1),
        likely_causes=causes,
        recommended_action=action,
    )
