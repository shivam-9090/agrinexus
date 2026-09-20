import pytest

from app.config import Settings, get_settings
from app.main import app, rate_limiter
from app.services import federation
from fastapi.testclient import TestClient

client = TestClient(app)


def setup_function(_):
    federation.reset_for_tests()
    rate_limiter.reset()


@pytest.fixture
def require_api_key():
    """Force a federation API key for the duration of one test."""
    app.dependency_overrides[get_settings] = lambda: Settings(federation_api_key="test-secret")
    yield
    app.dependency_overrides.pop(get_settings, None)


def test_register_node_rejected_without_key_when_key_is_required(require_api_key):
    resp = client.post(
        "/api/v1/federation/nodes",
        json={"node_id": "n1", "country": "India", "region": "Bihar"},
    )
    assert resp.status_code == 401


def test_register_node_rejected_with_wrong_key(require_api_key):
    resp = client.post(
        "/api/v1/federation/nodes",
        json={"node_id": "n1", "country": "India", "region": "Bihar"},
        headers={"X-API-Key": "wrong-key"},
    )
    assert resp.status_code == 401


def test_register_node_accepted_with_correct_key(require_api_key):
    resp = client.post(
        "/api/v1/federation/nodes",
        json={"node_id": "n1", "country": "India", "region": "Bihar"},
        headers={"X-API-Key": "test-secret"},
    )
    assert resp.status_code == 200


def test_submit_insight_rejected_without_key_when_key_is_required(require_api_key):
    resp = client.post(
        "/api/v1/federation/insights",
        json={
            "node_id": "n1",
            "country": "India",
            "region": "Bihar",
            "crop": "wheat",
            "avg_soil_health_score": 80.0,
            "dominant_regenerative_practice": "legume rotation",
            "sample_size": 50,
            "submitted_at": "2026-01-01T00:00:00+00:00",
        },
    )
    assert resp.status_code == 401


def test_get_endpoints_stay_public_even_when_key_is_required(require_api_key):
    assert client.get("/api/v1/federation/nodes").status_code == 200
    assert client.get("/api/v1/federation/insights").status_code == 200
    assert client.get("/api/v1/federation/stats").status_code == 200


def test_writes_succeed_without_any_header_when_no_key_is_configured():
    # default app state: FEDERATION_API_KEY unset -- this is the documented
    # demo-mode default, not an accident
    resp = client.post(
        "/api/v1/federation/nodes",
        json={"node_id": "n1", "country": "India", "region": "Bihar"},
    )
    assert resp.status_code == 200
