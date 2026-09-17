"""Live satellite-derived agro-climatology via NASA POWER (free, keyless).

NASA POWER aggregates NASA satellite and reanalysis products (solar radiation,
precipitation, temperature, root-zone soil wetness) into an agriculture-ready
daily point API -- this is the "satellite data" leg of the problem statement.
"""
from __future__ import annotations

from datetime import date, timedelta

import httpx

from app.config import get_settings
from app.models.schemas import ClimateSnapshot

PARAMETERS = "ALLSKY_SFC_SW_DWN,PRECTOTCORR,T2M,GWETROOT"


async def get_climate_snapshot(latitude: float, longitude: float, lookback_days: int = 30) -> ClimateSnapshot:
    settings = get_settings()
    end = date.today() - timedelta(days=4)  # NASA POWER has a short latency
    start = end - timedelta(days=lookback_days)

    params = {
        "parameters": PARAMETERS,
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }

    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
        resp = await client.get(settings.nasa_power_url, params=params)
        resp.raise_for_status()
        data = resp.json()

    series = data.get("properties", {}).get("parameter", {})

    def _avg(key: str) -> float | None:
        values = [v for v in series.get(key, {}).values() if v is not None and v > -900]
        return round(sum(values) / len(values), 2) if values else None

    soil_moisture = _avg("GWETROOT")

    return ClimateSnapshot(
        source="power.larc.nasa.gov (satellite + reanalysis)",
        solar_radiation_kwh_m2=_avg("ALLSKY_SFC_SW_DWN"),
        avg_precipitation_mm_day=_avg("PRECTOTCORR"),
        avg_temperature_c=_avg("T2M"),
        soil_moisture_proxy_pct=round(soil_moisture * 100, 1) if soil_moisture is not None else None,
        period=f"{start.isoformat()} to {end.isoformat()}",
    )
