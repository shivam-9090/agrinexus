"""Structured (JSON-lines) logging setup.

Plain stdlib logging, no extra dependency -- one JSON object per log line so
it's directly greppable/ingestible by any log aggregator (CloudWatch, Loki,
whatever) without a separate shipper config. Configured once at app startup
via `configure_logging()`.
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone

_RESERVED = frozenset(logging.LogRecord("", 0, "", 0, "", (), None).__dict__) | {"message", "asctime"}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        # include any extra= fields the caller passed to logger.info(..., extra={...})
        for key, value in record.__dict__.items():
            if key not in _RESERVED and key not in payload:
                payload[key] = value

        return json.dumps(payload, default=str)


def configure_logging() -> None:
    level = os.environ.get("LOG_LEVEL", "INFO").upper()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)

    # uvicorn's own loggers otherwise print plain text and duplicate access logs
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers = [handler]
        logging.getLogger(name).propagate = False

    # we log our own request line in app.middleware; uvicorn's built-in
    # access log would just duplicate it in a different format
    logging.getLogger("uvicorn.access").disabled = True
