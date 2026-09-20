from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware import RateLimitMiddleware
from app.services.rate_limiter import RateLimiter


def make_app(max_requests: int) -> TestClient:
    app = FastAPI()
    limiter = RateLimiter(max_requests=max_requests, window_seconds=60)
    app.add_middleware(RateLimitMiddleware, limiter=limiter)

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return TestClient(app)


def test_requests_within_the_limit_succeed():
    client = make_app(max_requests=2)
    assert client.get("/ping").status_code == 200
    assert client.get("/ping").status_code == 200


def test_exceeding_the_limit_returns_429_with_retry_after():
    client = make_app(max_requests=2)
    client.get("/ping")
    client.get("/ping")

    resp = client.get("/ping")
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers
    assert resp.json()["detail"]


def test_health_endpoint_is_exempt_from_the_limit():
    client = make_app(max_requests=1)
    client.get("/ping")  # consume the only slot

    for _ in range(5):
        assert client.get("/health").status_code == 200
