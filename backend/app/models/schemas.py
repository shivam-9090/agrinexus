"""Pydantic request/response schemas for the AgriNexus API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    place_name: str | None = None


class SoilSample(BaseModel):
    nitrogen: float = Field(..., ge=0, le=300, description="kg/ha")
    phosphorus: float = Field(..., ge=0, le=300, description="kg/ha")
    potassium: float = Field(..., ge=0, le=300, description="kg/ha")
    ph: float = Field(..., ge=0, le=14)
    organic_carbon_pct: float | None = Field(None, ge=0, le=20)


class AdvisoryRequest(BaseModel):
    location: Location
    soil: SoilSample
    current_crop: str | None = None
    irrigation_available: bool = True


class CropRecommendation(BaseModel):
    crop: str
    confidence: float
    rationale: str


class WeatherSnapshot(BaseModel):
    source: str
    daily_dates: list[str]
    temperature_max_c: list[float]
    temperature_min_c: list[float]
    precipitation_mm: list[float]
    relative_humidity_pct: float | None = None


class ClimateSnapshot(BaseModel):
    source: str
    solar_radiation_kwh_m2: float | None = None
    avg_precipitation_mm_day: float | None = None
    avg_temperature_c: float | None = None
    soil_moisture_proxy_pct: float | None = None
    period: str


class RegenerativePractice(BaseModel):
    practice: str
    reason: str
    priority: Literal["high", "medium", "low"]


class AdvisoryResponse(BaseModel):
    location: Location
    soil_health_score: float
    crop_recommendations: list[CropRecommendation]
    weather: WeatherSnapshot
    climate: ClimateSnapshot
    regenerative_practices: list[RegenerativePractice]
    generated_at: str


class DiseaseDiagnosis(BaseModel):
    stress_level: Literal["healthy", "mild_stress", "moderate_stress", "severe_stress"]
    healthy_tissue_pct: float
    discoloration_pct: float
    likely_causes: list[str]
    recommended_action: str
    method: str = "opencv-heuristic-v1"


class FederationNode(BaseModel):
    node_id: str
    country: str
    region: str
    contact: str | None = None


class RegionalInsight(BaseModel):
    node_id: str
    country: str
    region: str
    crop: str
    avg_soil_health_score: float
    dominant_regenerative_practice: str
    sample_size: int
    submitted_at: str
