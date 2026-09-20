from __future__ import annotations

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.services.rate_limiter import RateLimiter

logger = logging.getLogger("app.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs one structured line per request: method, path, status, duration.

    Also stamps every response with X-Request-ID so a specific request can
    be traced from a browser network tab straight to its log line.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        start = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client": request.client.host if request.client else None,
            },
        )
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-client-IP sliding-window throttle.

    Applies to every path except /health (used by uptime checks/orchestrators,
    which would otherwise burn through the budget on their own). Returns 429
    with Retry-After rather than raising, so it works regardless of where it
    sits relative to Starlette's own exception-handling middleware.
    """

    EXEMPT_PATHS = {"/health"}

    def __init__(self, app, limiter: RateLimiter) -> None:
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        client_key = request.client.host if request.client else "unknown"
        allowed, retry_after = self.limiter.allow(client_key)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please slow down and try again shortly."},
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
