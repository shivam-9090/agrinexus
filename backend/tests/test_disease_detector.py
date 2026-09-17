import io

import numpy as np
from PIL import Image

from app.services.disease_detector import diagnose


def _make_image_bytes(rgb_color: tuple[int, int, int]) -> bytes:
    arr = np.full((100, 100, 3), rgb_color, dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


def test_solid_green_image_is_healthy():
    result = diagnose(_make_image_bytes((30, 140, 30)))
    assert result.stress_level == "healthy"
    assert result.healthy_tissue_pct > 50


def test_solid_brown_image_shows_severe_stress():
    result = diagnose(_make_image_bytes((120, 80, 20)))
    assert result.stress_level in {"moderate_stress", "severe_stress"}
    assert result.discoloration_pct > 15
