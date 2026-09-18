import json
import logging

from app.logging_config import JsonFormatter


def _make_record(**extra) -> logging.LogRecord:
    record = logging.LogRecord(
        name="app.request",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="request_completed",
        args=(),
        exc_info=None,
    )
    for key, value in extra.items():
        setattr(record, key, value)
    return record


def test_format_produces_valid_json_with_core_fields():
    record = _make_record()
    output = json.loads(JsonFormatter().format(record))

    assert output["level"] == "INFO"
    assert output["logger"] == "app.request"
    assert output["message"] == "request_completed"
    assert "timestamp" in output


def test_format_includes_extra_fields():
    record = _make_record(request_id="abc-123", status_code=200, duration_ms=12.5)
    output = json.loads(JsonFormatter().format(record))

    assert output["request_id"] == "abc-123"
    assert output["status_code"] == 200
    assert output["duration_ms"] == 12.5


def test_format_includes_exception_info():
    try:
        raise ValueError("boom")
    except ValueError:
        import sys

        record = logging.LogRecord(
            name="app.advisory",
            level=logging.WARNING,
            pathname=__file__,
            lineno=1,
            msg="weather_provider_failed",
            args=(),
            exc_info=sys.exc_info(),
        )

    output = json.loads(JsonFormatter().format(record))
    assert "boom" in output["exc_info"]
