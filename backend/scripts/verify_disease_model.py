"""Manual, network-dependent sanity check for the disease classifier.

Not part of `pytest` (unit tests inject a fake classifier and never touch
the network or a real model -- see tests/test_disease_model.py). This
script instead downloads the real model and runs it against a real,
CC-licensed photo of tomato late blight from Wikimedia Commons, so you can
re-verify "does the actual model actually work" after touching
disease_model.py, independent of the mocked test suite.

Usage: python scripts/verify_disease_model.py (run from the backend/ directory)
"""
from __future__ import annotations

import pathlib
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from app.services.disease_model import diagnose_with_model  # noqa: E402

TEST_IMAGE_URL = (
    "https://commons.wikimedia.org/wiki/Special:FilePath/"
    "Tomato_late_blight_foliar_lesions_(5816740026).jpg"
)
EXPECTED_SUBSTRING = "late blight"


def main() -> int:
    print(f"Downloading test photo: {TEST_IMAGE_URL}")
    # Wikimedia rejects requests without a descriptive User-Agent (bot policy)
    request = urllib.request.Request(
        TEST_IMAGE_URL, headers={"User-Agent": "AgriNexus-dev-verification-script/1.0"}
    )
    with urllib.request.urlopen(request, timeout=20) as resp:
        image_bytes = resp.read()

    print("Running the real classifier (first run also downloads model weights)...")
    result = diagnose_with_model(image_bytes)

    print(f"stress_level:      {result.stress_level}")
    print(f"predicted_label:   {result.predicted_label}")
    print(f"confidence:        {result.confidence}")
    print(f"likely_causes:     {result.likely_causes}")

    if EXPECTED_SUBSTRING not in " ".join(result.likely_causes).lower():
        print(f"FAIL: expected '{EXPECTED_SUBSTRING}' in likely_causes")
        return 1

    print("OK: model correctly identified late blight in a real photo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
