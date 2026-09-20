"""In-process sliding-window rate limiter.

Single-instance only (state lives in a dict, not shared across processes) --
appropriate for the single backend container this project ships. A
multi-instance deployment would swap this for Redis behind the same
`allow(key)` signature, same pattern as services/cache.py.

Exists because the advisory and disease endpoints are the expensive ones
(external API calls, CNN inference) and have no protection today beyond the
response cache -- a judge (or anyone) mashing the submit button repeatedly
has no backend-side throttle. This doesn't require auth or accounts; it
just caps requests per client IP per time window.
"""
from __future__ import annotations

import threading
import time


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds). retry_after is 0 when allowed."""
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            hits = self._hits.setdefault(key, [])
            while hits and hits[0] < cutoff:
                hits.pop(0)

            if len(hits) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - hits[0])) + 1)
                return False, retry_after

            hits.append(now)
            return True, 0

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()
