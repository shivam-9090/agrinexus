import httpx
import pytest
import respx
from httpx import Response

from app.config import get_settings
from app.services import climate_service

settings = get_settings()


@pytest.mark.asyncio
@respx.mock
async def test_get_climate_snapshot_averages_series():
    respx.get(settings.nasa_power_url).mock(
        return_value=Response(
            200,
            json={
                "properties": {
                    "parameter": {
                        "ALLSKY_SFC_SW_DWN": {"20260101": 5.0, "20260102": 7.0},
                        "PRECTOTCORR": {"20260101": 2.0, "20260102": 4.0},
                        "T2M": {"20260101": 20.0, "20260102": 22.0},
                        "GWETROOT": {"20260101": 0.3, "20260102": 0.5},
                    }
                }
            },
        )
    )
    snapshot = await climate_service.get_climate_snapshot(20.5, 78.9)
    assert snapshot.solar_radiation_kwh_m2 == 6.0
    assert snapshot.avg_precipitation_mm_day == 3.0
    assert snapshot.avg_temperature_c == 21.0
    assert snapshot.soil_moisture_proxy_pct == 40.0
    assert "power.larc.nasa.gov" in snapshot.source


@pytest.mark.asyncio
@respx.mock
async def test_get_climate_snapshot_filters_fill_values():
    # NASA POWER uses -999 (or similar) as a fill value for missing data
    respx.get(settings.nasa_power_url).mock(
        return_value=Response(
            200,
            json={
                "properties": {
                    "parameter": {
                        "ALLSKY_SFC_SW_DWN": {"20260101": -999, "20260102": 8.0},
                        "PRECTOTCORR": {"20260101": -999},
                        "T2M": {"20260101": -999},
                        "GWETROOT": {"20260101": -999},
                    }
                }
            },
        )
    )
    snapshot = await climate_service.get_climate_snapshot(0, 0)
    assert snapshot.solar_radiation_kwh_m2 == 8.0
    assert snapshot.avg_precipitation_mm_day is None
    assert snapshot.avg_temperature_c is None
    assert snapshot.soil_moisture_proxy_pct is None


@pytest.mark.asyncio
@respx.mock
async def test_get_climate_snapshot_raises_on_http_error():
    respx.get(settings.nasa_power_url).mock(return_value=Response(503))
    with pytest.raises(httpx.HTTPStatusError):
        await climate_service.get_climate_snapshot(0, 0)
