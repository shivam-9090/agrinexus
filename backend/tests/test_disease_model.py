import io

import numpy as np
import pytest
from PIL import Image

from app.services.disease_model import _parse_label, diagnose_with_model


def _make_image_bytes(rgb_color=(40, 140, 40)) -> bytes:
    arr = np.full((100, 100, 3), rgb_color, dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


def test_parse_label_splits_crop_and_condition():
    assert _parse_label("Tomato with Late Blight") == ("Tomato", "Late Blight")
    assert _parse_label("Corn (Maize) with Common Rust") == ("Corn (Maize)", "Common Rust")


def test_parse_label_handles_healthy_variants():
    assert _parse_label("Healthy Apple") == ("Apple", "healthy")
    assert _parse_label("Healthy Corn (Maize) Plant") == ("Corn (Maize)", "healthy")


def test_parse_label_handles_labels_without_with_separator():
    # two real labels from this model have no "with": "Tomato Yellow Leaf
    # Curl Virus" and "Tomato Mosaic Virus" -- verified against the model's
    # actual id2label mapping, not guessed
    assert _parse_label("Tomato Yellow Leaf Curl Virus") == ("Tomato", "Yellow Leaf Curl Virus")
    assert _parse_label("Tomato Mosaic Virus") == ("Tomato", "Mosaic Virus")


def test_parse_label_falls_back_to_generic_plant_for_unknown_crop():
    crop, condition = _parse_label("Unlisted Crop Disease")
    assert crop == "plant"
    assert condition == "Unlisted Crop Disease"


def test_diagnose_with_model_healthy_prediction():
    def fake_classifier(_image):
        return [{"label": "Healthy Tomato Plant", "score": 0.97}]

    result = diagnose_with_model(_make_image_bytes(), classifier=fake_classifier)

    assert result.stress_level == "healthy"
    assert result.predicted_label == "Healthy Tomato Plant"
    assert result.confidence == 0.97
    assert result.likely_causes == []
    assert result.healthy_tissue_pct is None
    assert result.method == "cnn:mobilenet_v2_1.0_224-plant-disease-identification"


def test_diagnose_with_model_high_confidence_disease_is_severe():
    def fake_classifier(_image):
        return [{"label": "Tomato with Late Blight", "score": 0.92}]

    result = diagnose_with_model(_make_image_bytes(), classifier=fake_classifier)

    assert result.stress_level == "severe_stress"
    assert "late blight" in result.likely_causes[0]


def test_diagnose_with_model_moderate_confidence_disease():
    def fake_classifier(_image):
        return [{"label": "Corn (Maize) with Common Rust", "score": 0.65}]

    result = diagnose_with_model(_make_image_bytes(), classifier=fake_classifier)
    assert result.stress_level == "moderate_stress"


def test_diagnose_with_model_low_confidence_disease_is_mild():
    def fake_classifier(_image):
        return [{"label": "Grape with Black Rot", "score": 0.3}]

    result = diagnose_with_model(_make_image_bytes(), classifier=fake_classifier)
    assert result.stress_level == "mild_stress"


def test_diagnose_with_model_picks_highest_score_when_multiple_results():
    def fake_classifier(_image):
        return [
            {"label": "Healthy Tomato Plant", "score": 0.2},
            {"label": "Tomato with Late Blight", "score": 0.75},
        ]

    result = diagnose_with_model(_make_image_bytes(), classifier=fake_classifier)
    assert result.predicted_label == "Tomato with Late Blight"


def test_diagnose_with_model_raises_on_empty_results():
    with pytest.raises(ValueError):
        diagnose_with_model(_make_image_bytes(), classifier=lambda _image: [])


def test_diagnose_with_model_raises_on_invalid_image_bytes_without_calling_classifier():
    called = False

    def fake_classifier(_image):
        nonlocal called
        called = True
        return [{"label": "Tomato___healthy", "score": 0.9}]

    with pytest.raises(Exception):
        diagnose_with_model(b"not-an-image", classifier=fake_classifier)
    assert called is False
