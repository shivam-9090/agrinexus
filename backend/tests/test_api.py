import respx
from fastapi.testclient import TestClient
from httpx import Response

from app.config import get_settings
from app.main import app

client = TestClient(app)
settings = get_settings()


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@respx.mock
def test_advisory_endpoint_end_to_end():
    respx.get(settings.open_meteo_forecast_url).mock(
        return_value=Response(
            200,
            json={
                "daily": {
                    "time": ["2026-01-01", "2026-01-02"],
                    "temperature_2m_max": [30, 31],
                    "temperature_2m_min": [20, 21],
                    "precipitation_sum": [5, 10],
                },
                "current": {"relative_humidity_2m": 70},
            },
        )
    )
    respx.get(settings.nasa_power_url).mock(
        return_value=Response(
            200,
            json={
                "properties": {
                    "parameter": {
                        "ALLSKY_SFC_SW_DWN": {"20260101": 5.2, "20260102": 5.4},
                        "PRECTOTCORR": {"20260101": 4.0, "20260102": 6.0},
                        "T2M": {"20260101": 26.0, "20260102": 27.0},
                        "GWETROOT": {"20260101": 0.4, "20260102": 0.45},
                    }
                }
            },
        )
    )

    payload = {
        "location": {"latitude": 20.5, "longitude": 78.9, "place_name": "Test Region"},
        "soil": {"nitrogen": 90, "phosphorus": 40, "potassium": 40, "ph": 6.5, "organic_carbon_pct": 0.8},
        "current_crop": "wheat",
        "irrigation_available": True,
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["crop_recommendations"]) == 3
    assert body["weather"]["source"] == "open-meteo.com"
    assert body["climate"]["source"].startswith("power.larc.nasa.gov")
    assert "regenerative_practices" in body


def test_advisory_endpoint_rejects_invalid_soil():
    payload = {
        "location": {"latitude": 20.5, "longitude": 78.9},
        "soil": {"nitrogen": -5, "phosphorus": 40, "potassium": 40, "ph": 6.5},
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 422


@respx.mock
def test_advisory_endpoint_propagates_weather_provider_failure():
    respx.get(settings.open_meteo_forecast_url).mock(return_value=Response(503))
    payload = {
        "location": {"latitude": 20.5, "longitude": 78.9},
        "soil": {"nitrogen": 90, "phosphorus": 40, "potassium": 40, "ph": 6.5},
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 502
    assert "Weather provider" in resp.json()["detail"]


@respx.mock
def test_advisory_endpoint_propagates_climate_provider_failure():
    respx.get(settings.open_meteo_forecast_url).mock(
        return_value=Response(
            200,
            json={
                "daily": {"time": [], "temperature_2m_max": [], "temperature_2m_min": [], "precipitation_sum": []},
                "current": {"relative_humidity_2m": 60},
            },
        )
    )
    respx.get(settings.nasa_power_url).mock(return_value=Response(500))
    payload = {
        "location": {"latitude": 20.5, "longitude": 78.9},
        "soil": {"nitrogen": 90, "phosphorus": 40, "potassium": 40, "ph": 6.5},
    }
    resp = client.post("/api/v1/advisory", json=payload)
    assert resp.status_code == 502
    assert "Climate provider" in resp.json()["detail"]


def test_disease_diagnose_rejects_unsupported_content_type():
    resp = client.post(
        "/api/v1/disease/diagnose",
        files={"image": ("leaf.txt", b"not an image", "text/plain")},
    )
    assert resp.status_code == 415


def test_disease_diagnose_rejects_empty_file():
    resp = client.post(
        "/api/v1/disease/diagnose",
        files={"image": ("leaf.png", b"", "image/png")},
    )
    assert resp.status_code == 400


def test_disease_diagnose_rejects_corrupt_image_bytes():
    resp = client.post(
        "/api/v1/disease/diagnose",
        files={"image": ("leaf.png", b"\x89PNGnotarealpngfile", "image/png")},
    )
    assert resp.status_code == 422


def test_federation_register_and_stats_roundtrip():
    node = {"node_id": "in-mh-01", "country": "India", "region": "Maharashtra", "contact": "demo@example.org"}
    resp = client.post("/api/v1/federation/nodes", json=node)
    assert resp.status_code == 200

    insight = {
        "node_id": "in-mh-01",
        "country": "India",
        "region": "Maharashtra",
        "crop": "wheat",
        "avg_soil_health_score": 82.5,
        "dominant_regenerative_practice": "legume rotation",
        "sample_size": 120,
        "submitted_at": "2026-01-01T00:00:00+00:00",
    }
    resp = client.post("/api/v1/federation/insights", json=insight)
    assert resp.status_code == 200

    resp = client.get("/api/v1/federation/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["registered_nodes"] >= 1
    assert "India" in stats["participating_countries"]
