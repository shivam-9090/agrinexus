import asyncio

import pytest

from app.services.cache import TTLCache, round_coord


@pytest.mark.asyncio
async def test_get_or_set_calls_factory_once_within_ttl():
    cache = TTLCache()
    calls = 0

    async def factory():
        nonlocal calls
        calls += 1
        return "value"

    first = await cache.get_or_set("key", 60, factory)
    second = await cache.get_or_set("key", 60, factory)

    assert first == second == "value"
    assert calls == 1


@pytest.mark.asyncio
async def test_get_or_set_refetches_after_ttl_expires(monkeypatch):
    cache = TTLCache()
    calls = 0

    async def factory():
        nonlocal calls
        calls += 1
        return calls

    fake_time = [1000.0]
    monkeypatch.setattr("app.services.cache.time.monotonic", lambda: fake_time[0])

    first = await cache.get_or_set("key", 10, factory)
    fake_time[0] += 20  # advance past the 10s TTL
    second = await cache.get_or_set("key", 10, factory)

    assert first == 1
    assert second == 2


@pytest.mark.asyncio
async def test_get_or_set_does_not_cache_a_raised_exception():
    cache = TTLCache()
    calls = 0

    async def flaky_factory():
        nonlocal calls
        calls += 1
        if calls == 1:
            raise RuntimeError("boom")
        return "recovered"

    with pytest.raises(RuntimeError):
        await cache.get_or_set("key", 60, flaky_factory)

    result = await cache.get_or_set("key", 60, flaky_factory)
    assert result == "recovered"
    assert calls == 2


@pytest.mark.asyncio
async def test_concurrent_get_or_set_dedupes_to_a_single_factory_call():
    cache = TTLCache()
    calls = 0

    async def slow_factory():
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.05)
        return "value"

    results = await asyncio.gather(*[cache.get_or_set("key", 60, slow_factory) for _ in range(5)])

    assert results == ["value"] * 5
    assert calls == 1


def test_clear_removes_all_entries():
    cache = TTLCache()
    cache._store["a"] = (1e18, "x")
    assert cache.size() == 1
    cache.clear()
    assert cache.size() == 0


def test_round_coord_groups_nearby_values():
    assert round_coord(20.501) == round_coord(20.503)
    assert round_coord(20.501) != round_coord(20.6)
