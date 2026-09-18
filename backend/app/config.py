"""Application configuration."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AgriNexus API"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["*"]

    open_meteo_forecast_url: str = "https://api.open-meteo.com/v1/forecast"
    open_meteo_geocoding_url: str = "https://geocoding-api.open-meteo.com/v1/search"
    nasa_power_url: str = "https://power.larc.nasa.gov/api/temporal/daily/point"

    http_timeout_seconds: float = 10.0

    rate_limit_enabled: bool = True
    rate_limit_requests: int = 120
    rate_limit_window_seconds: float = 60.0

    # Shared secret required on POST /federation/* when set. Unset by
    # default so local dev/demo works with zero setup; a real deployment
    # should set this (and, ideally, move to per-node credentials -- see
    # docs/architecture.md).
    federation_api_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
