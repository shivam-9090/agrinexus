from app.models.schemas import DiseaseDiagnosis
from app.services import disease_service


def _stub_diagnosis(**overrides) -> DiseaseDiagnosis:
    defaults = dict(
        stress_level="healthy",
        likely_causes=[],
        recommended_action="looks fine",
        method="cnn:stub",
    )
    defaults.update(overrides)
    return DiseaseDiagnosis(**defaults)


def test_diagnose_uses_cnn_result_when_it_succeeds(monkeypatch):
    monkeypatch.setattr(
        disease_service.disease_model,
        "diagnose_with_model",
        lambda image_bytes: _stub_diagnosis(),
    )

    result = disease_service.diagnose(b"fake-bytes")

    assert result.method == "cnn:stub"


def test_diagnose_falls_back_to_heuristic_when_cnn_raises(monkeypatch):
    def raise_error(image_bytes):
        raise RuntimeError("model unavailable")

    monkeypatch.setattr(disease_service.disease_model, "diagnose_with_model", raise_error)
    monkeypatch.setattr(
        disease_service.disease_detector,
        "diagnose",
        lambda image_bytes: _stub_diagnosis(method="opencv-heuristic-v1"),
    )

    result = disease_service.diagnose(b"fake-bytes")

    assert result.method == "opencv-heuristic-v1"


def test_diagnose_propagates_error_when_both_paths_fail(monkeypatch):
    def raise_cnn_error(image_bytes):
        raise RuntimeError("model unavailable")

    def raise_heuristic_error(image_bytes):
        raise ValueError("bad image")

    monkeypatch.setattr(disease_service.disease_model, "diagnose_with_model", raise_cnn_error)
    monkeypatch.setattr(disease_service.disease_detector, "diagnose", raise_heuristic_error)

    import pytest

    with pytest.raises(ValueError):
        disease_service.diagnose(b"fake-bytes")
