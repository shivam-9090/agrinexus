import httpx
import pytest
import respx
from httpx import Response

from app.config import get_settings
from app.services import weather_service

settings = get_settings()


@pytest.mark.asyncio
@respx.mock
async def test_get_weather_forecast_parses_daily_and_current():
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
                "current": {"relative_humidity_2m": 72},
            },
        )
    )
    snapshot = await weather_service.get_weather_forecast(20.5, 78.9)
    assert snapshot.source == "open-meteo.com"
    assert snapshot.daily_dates == ["2026-01-01", "2026-01-02"]
    assert snapshot.temperature_max_c == [30, 31]
    assert snapshot.relative_humidity_pct == 72


@pytest.mark.asyncio
@respx.mock
async def test_get_weather_forecast_missing_keys_defaults_to_empty():
    respx.get(settings.open_meteo_forecast_url).mock(return_value=Response(200, json={}))
    snapshot = await weather_service.get_weather_forecast(0, 0)
    assert snapshot.daily_dates == []
    assert snapshot.relative_humidity_pct is None


@pytest.mark.asyncio
@respx.mock
async def test_get_weather_forecast_raises_on_http_error():
    respx.get(settings.open_meteo_forecast_url).mock(return_value=Response(500))
    with pytest.raises(httpx.HTTPStatusError):
        await weather_service.get_weather_forecast(0, 0)


@pytest.mark.asyncio
@respx.mock
async def test_geocode_place_returns_results_list():
    respx.get(settings.open_meteo_geocoding_url).mock(
        return_value=Response(
            200,
            json={"results": [{"name": "Nagpur", "latitude": 21.14, "longitude": 79.08, "country": "India"}]},
        )
    )
    results = await weather_service.geocode_place("Nagpur")
    assert len(results) == 1
    assert results[0]["name"] == "Nagpur"


@pytest.mark.asyncio
@respx.mock
async def test_geocode_place_no_results():
    respx.get(settings.open_meteo_geocoding_url).mock(return_value=Response(200, json={}))
    results = await weather_service.geocode_place("Nowhereville")
    assert results == []
