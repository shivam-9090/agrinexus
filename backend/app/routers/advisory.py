from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.models.schemas import AdvisoryRequest, AdvisoryResponse
from app.services import climate_service, crop_recommender, regenerative_engine, weather_service

router = APIRouter(prefix="/advisory", tags=["advisory"])


@router.post("", response_model=AdvisoryResponse)
async def get_advisory(payload: AdvisoryRequest) -> AdvisoryResponse:
    try:
        weather = await weather_service.get_weather_forecast(
            payload.location.latitude, payload.location.longitude
        )
    except Exception as exc:  # pragma: no cover - network failure path
        raise HTTPException(status_code=502, detail=f"Weather provider error: {exc}") from exc

    try:
        climate = await climate_service.get_climate_snapshot(
            payload.location.latitude, payload.location.longitude
        )
    except Exception as exc:  # pragma: no cover - network failure path
        raise HTTPException(status_code=502, detail=f"Climate provider error: {exc}") from exc

    avg_temp = climate.avg_temperature_c if climate.avg_temperature_c is not None else (
        sum(weather.temperature_max_c + weather.temperature_min_c) / max(len(weather.temperature_max_c) * 2, 1)
    )
    avg_rainfall = (
        climate.avg_precipitation_mm_day * 7
        if climate.avg_precipitation_mm_day is not None
        else sum(weather.precipitation_mm)
    )
    humidity = weather.relative_humidity_pct if weather.relative_humidity_pct is not None else 60.0

    recommendations = crop_recommender.recommend_crops(
        nitrogen=payload.soil.nitrogen,
        phosphorus=payload.soil.phosphorus,
        potassium=payload.soil.potassium,
        ph=payload.soil.ph,
        temperature=avg_temp,
        humidity=humidity,
        rainfall=avg_rainfall,
    )

    practices = regenerative_engine.recommend_practices(
        soil=payload.soil,
        climate=climate,
        current_crop=payload.current_crop,
        irrigation_available=payload.irrigation_available,
    )

    return AdvisoryResponse(
        location=payload.location,
        soil_health_score=regenerative_engine.soil_health_score(payload.soil),
        crop_recommendations=recommendations,
        weather=weather,
        climate=climate,
        regenerative_practices=practices,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/geocode")
async def geocode(query: str) -> list[dict]:
    return await weather_service.geocode_place(query)
