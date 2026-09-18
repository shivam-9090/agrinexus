import httpx
import pytest
import respx
from httpx import Response

from app.config import get_settings
from app.services import climate_service

settings = get_settings()


def setup_function(_):
    # the service caches responses per (rounded) coordinate; without
    # resetting, tests that reuse a coordinate would see a previous test's
    # mocked response instead of exercising their own respx mock
    climate_service.reset_cache()


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


@pytest.mark.asyncio
@respx.mock
async def test_get_climate_snapshot_second_call_uses_cache_not_http():
    route = respx.get(settings.nasa_power_url).mock(
        return_value=Response(
            200,
            json={
                "properties": {
                    "parameter": {
                        "ALLSKY_SFC_SW_DWN": {"20260101": 5.0},
                        "PRECTOTCORR": {"20260101": 2.0},
                        "T2M": {"20260101": 20.0},
                        "GWETROOT": {"20260101": 0.3},
                    }
                }
            },
        )
    )
    first = await climate_service.get_climate_snapshot(20.5, 78.9)
    second = await climate_service.get_climate_snapshot(20.5, 78.9)
    assert first == second
    assert route.call_count == 1


@pytest.mark.asyncio
@respx.mock
async def test_get_climate_snapshot_failed_fetch_is_not_cached():
    route = respx.get(settings.nasa_power_url).mock(
        side_effect=[
            Response(503),
            Response(
                200,
                json={
                    "properties": {
                        "parameter": {
                            "ALLSKY_SFC_SW_DWN": {"20260101": 5.0},
                            "PRECTOTCORR": {"20260101": 2.0},
                            "T2M": {"20260101": 20.0},
                            "GWETROOT": {"20260101": 0.3},
                        }
                    }
                },
            ),
        ]
    )
    with pytest.raises(httpx.HTTPStatusError):
        await climate_service.get_climate_snapshot(20.5, 78.9)

    snapshot = await climate_service.get_climate_snapshot(20.5, 78.9)
    assert snapshot.avg_temperature_c == 20.0
    assert route.call_count == 2
