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


def test_mixed_green_and_brown_image_is_mild_or_moderate():
    arr = np.full((100, 100, 3), (30, 140, 30), dtype=np.uint8)
    arr[:20, :, :] = (110, 70, 20)  # brown strip along the top ~20%
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    result = diagnose(buf.getvalue())
    assert result.stress_level in {"mild_stress", "moderate_stress"}
    assert 0 < result.discoloration_pct < 100


def test_diagnose_raises_on_invalid_image_bytes():
    import pytest

    with pytest.raises(Exception):
        diagnose(b"not-an-image")


def test_diagnose_handles_grayscale_source_image():
    arr = np.full((100, 100), 100, dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr, mode="L").save(buf, format="PNG")
    result = diagnose(buf.getvalue())
    assert result.stress_level in {"healthy", "mild_stress", "moderate_stress", "severe_stress"}
