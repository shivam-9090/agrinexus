"""Tiny in-process TTL cache for external API calls.

Open-Meteo and NASA POWER are free and keyless, which is great for a
hackathon demo with zero credential setup -- but that also means no SLA and
plausible rate limiting if a judge mashes the "Get advisory" button on the
same location a few times in a row. This cache absorbs repeat lookups for
the same (rounded) coordinates without changing any call site's behavior:
callers still just `await` a coroutine and get a value back, cached or not.

Not meant to survive a restart (in-process only) and not a distributed
cache -- appropriate for a single backend instance. A multi-instance
deployment would swap this for Redis behind the same `get_or_set` signature.
"""
from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


class TTLCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, object]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    def _lock_for(self, key: str) -> asyncio.Lock:
        lock = self._locks.get(key)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[key] = lock
        return lock

    async def get_or_set(self, key: str, ttl_seconds: float, factory: Callable[[], Awaitable[T]]) -> T:
        cached = self._store.get(key)
        if cached is not None:
            expires_at, value = cached
            if time.monotonic() < expires_at:
                return value  # type: ignore[return-value]

        async with self._lock_for(key):
            # re-check: another coroutine may have refreshed it while we waited
            cached = self._store.get(key)
            if cached is not None:
                expires_at, value = cached
                if time.monotonic() < expires_at:
                    return value  # type: ignore[return-value]

            value = await factory()
            self._store[key] = (time.monotonic() + ttl_seconds, value)
            return value

    def clear(self) -> None:
        self._store.clear()
        self._locks.clear()

    def size(self) -> int:
        return len(self._store)


def round_coord(value: float, precision: int = 2) -> float:
    """Round lat/lon to ~1km precision so nearby requests share a cache entry."""
    return round(value, precision)
