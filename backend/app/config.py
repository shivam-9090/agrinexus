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


@lru_cache
def get_settings() -> Settings:
    return Settings()
