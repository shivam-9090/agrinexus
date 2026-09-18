from app.services.rate_limiter import RateLimiter


def test_allows_requests_up_to_the_max():
    limiter = RateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        allowed, retry_after = limiter.allow("client-a")
        assert allowed is True
        assert retry_after == 0


def test_blocks_once_the_max_is_exceeded():
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    limiter.allow("client-a")
    limiter.allow("client-a")
    allowed, retry_after = limiter.allow("client-a")
    assert allowed is False
    assert retry_after > 0


def test_different_keys_have_independent_budgets():
    limiter = RateLimiter(max_requests=1, window_seconds=60)
    assert limiter.allow("client-a")[0] is True
    assert limiter.allow("client-a")[0] is False
    assert limiter.allow("client-b")[0] is True


def test_allows_again_after_the_window_expires(monkeypatch):
    limiter = RateLimiter(max_requests=1, window_seconds=10)
    fake_time = [1000.0]
    monkeypatch.setattr("app.services.rate_limiter.time.monotonic", lambda: fake_time[0])

    assert limiter.allow("client-a")[0] is True
    assert limiter.allow("client-a")[0] is False

    fake_time[0] += 11  # advance past the 10s window
    assert limiter.allow("client-a")[0] is True


def test_reset_clears_all_state():
    limiter = RateLimiter(max_requests=1, window_seconds=60)
    limiter.allow("client-a")
    assert limiter.allow("client-a")[0] is False

    limiter.reset()
    assert limiter.allow("client-a")[0] is True
