from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logging_config import configure_logging
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from app.routers import advisory, disease, federation
from app.services.rate_limiter import RateLimiter

configure_logging()

settings = get_settings()
logger = logging.getLogger("app.startup")

if not settings.federation_api_key:
    logger.warning(
        "federation_write_endpoints_unauthenticated",
        extra={
            "hint": "POST /federation/nodes and /federation/insights accept requests from "
            "anyone. Set FEDERATION_API_KEY to require an X-API-Key header on writes."
        },
    )

app = FastAPI(
    title=settings.app_name,
    description=(
        "Open regenerative-agriculture intelligence API for Track 4 (AgriN) -- "
        "real-time localized agro-advisories, satellite/weather-driven crop "
        "recommendations, a crop-stress diagnostic tool, and a BRICS "
        "cooperation/data-sharing federation layer."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rate_limiter = RateLimiter(settings.rate_limit_requests, settings.rate_limit_window_seconds)
if settings.rate_limit_enabled:
    app.add_middleware(RateLimitMiddleware, limiter=rate_limiter)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(advisory.router, prefix=settings.api_v1_prefix)
app.include_router(disease.router, prefix=settings.api_v1_prefix)
app.include_router(federation.router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.app_name}
