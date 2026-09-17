"""Live weather forecast via Open-Meteo (free, keyless)."""
from __future__ import annotations

import httpx

from app.config import get_settings
from app.models.schemas import WeatherSnapshot


async def get_weather_forecast(latitude: float, longitude: float) -> WeatherSnapshot:
    settings = get_settings()
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "current": "relative_humidity_2m",
        "forecast_days": 7,
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
        resp = await client.get(settings.open_meteo_forecast_url, params=params)
        resp.raise_for_status()
        data = resp.json()

    daily = data.get("daily", {})
    current = data.get("current", {})

    return WeatherSnapshot(
        source="open-meteo.com",
        daily_dates=daily.get("time", []),
        temperature_max_c=daily.get("temperature_2m_max", []),
        temperature_min_c=daily.get("temperature_2m_min", []),
        precipitation_mm=daily.get("precipitation_sum", []),
        relative_humidity_pct=current.get("relative_humidity_2m"),
    )


async def geocode_place(query: str) -> list[dict]:
    settings = get_settings()
    params = {"name": query, "count": 5, "language": "en", "format": "json"}
    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
        resp = await client.get(settings.open_meteo_geocoding_url, params=params)
        resp.raise_for_status()
        data = resp.json()
    return data.get("results", [])
