"""Generate a synthetic-but-agronomically-grounded crop recommendation dataset.

IMPORTANT (documented limitation): this dataset is generated from published
agronomic requirement RANGES per crop (FAO / ICAR extension guidance on typical
N-P-K, temperature, humidity, pH and rainfall requirements), not from real
field records. It is a placeholder for bootstrapping the recommendation
model quickly. Before production/judging deployment with real farmer data,
swap `CROP_RANGES` sourcing for a real regional dataset (e.g. ICAR soil health
card data, or a shared BRICS federation dataset via the /federation API).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

RNG_SEED = 42

# (N kg/ha, P kg/ha, K kg/ha, temp C, humidity %, pH, rainfall mm) as (min, max)
CROP_RANGES: dict[str, dict[str, tuple[float, float]]] = {
    "rice": dict(n=(80, 120), p=(35, 60), k=(35, 55), temp=(22, 32), humidity=(70, 95), ph=(5.5, 7.0), rainfall=(150, 300)),
    "wheat": dict(n=(90, 130), p=(40, 60), k=(30, 50), temp=(10, 22), humidity=(40, 65), ph=(6.0, 7.5), rainfall=(40, 100)),
    "maize": dict(n=(70, 110), p=(30, 55), k=(30, 50), temp=(18, 30), humidity=(50, 75), ph=(5.8, 7.2), rainfall=(60, 130)),
    "millet": dict(n=(30, 60), p=(15, 30), k=(15, 30), temp=(25, 35), humidity=(30, 55), ph=(5.5, 7.5), rainfall=(20, 60)),
    "sorghum": dict(n=(40, 70), p=(20, 35), k=(20, 35), temp=(24, 34), humidity=(35, 60), ph=(5.5, 7.5), rainfall=(30, 70)),
    "cotton": dict(n=(60, 100), p=(25, 45), k=(25, 45), temp=(21, 32), humidity=(40, 65), ph=(5.8, 8.0), rainfall=(50, 100)),
    "sugarcane": dict(n=(120, 180), p=(50, 80), k=(60, 100), temp=(21, 32), humidity=(65, 90), ph=(6.0, 7.5), rainfall=(100, 200)),
    "soybean": dict(n=(20, 40), p=(30, 55), k=(30, 55), temp=(20, 30), humidity=(55, 80), ph=(6.0, 7.0), rainfall=(60, 120)),
    "groundnut": dict(n=(15, 35), p=(25, 45), k=(30, 55), temp=(22, 32), humidity=(50, 75), ph=(5.8, 7.0), rainfall=(50, 100)),
    "chickpea": dict(n=(15, 30), p=(30, 50), k=(15, 30), temp=(15, 27), humidity=(35, 60), ph=(6.0, 7.5), rainfall=(30, 70)),
    "pigeonpea": dict(n=(15, 30), p=(20, 40), k=(15, 30), temp=(20, 32), humidity=(45, 70), ph=(5.5, 7.5), rainfall=(40, 90)),
    "sunflower": dict(n=(40, 70), p=(30, 55), k=(30, 50), temp=(18, 30), humidity=(35, 60), ph=(6.0, 7.5), rainfall=(35, 75)),
    "potato": dict(n=(90, 140), p=(45, 70), k=(80, 120), temp=(15, 24), humidity=(60, 85), ph=(5.0, 6.5), rainfall=(50, 100)),
    "tomato": dict(n=(70, 110), p=(40, 65), k=(60, 95), temp=(18, 29), humidity=(55, 80), ph=(6.0, 7.0), rainfall=(40, 90)),
    "onion": dict(n=(60, 100), p=(30, 55), k=(40, 70), temp=(13, 28), humidity=(50, 75), ph=(6.0, 7.5), rainfall=(35, 80)),
}


def _sample(rng: np.random.Generator, low: float, high: float, n: int) -> np.ndarray:
    return rng.uniform(low, high, n)


def generate(samples_per_crop: int = 200) -> pd.DataFrame:
    rng = np.random.default_rng(RNG_SEED)
    rows = []
    for crop, ranges in CROP_RANGES.items():
        n = _sample(rng, *ranges["n"], samples_per_crop)
        p = _sample(rng, *ranges["p"], samples_per_crop)
        k = _sample(rng, *ranges["k"], samples_per_crop)
        temp = _sample(rng, *ranges["temp"], samples_per_crop)
        humidity = _sample(rng, *ranges["humidity"], samples_per_crop)
        ph = _sample(rng, *ranges["ph"], samples_per_crop)
        rainfall = _sample(rng, *ranges["rainfall"], samples_per_crop)
        for i in range(samples_per_crop):
            rows.append(
                dict(
                    nitrogen=round(n[i], 2),
                    phosphorus=round(p[i], 2),
                    potassium=round(k[i], 2),
                    temperature=round(temp[i], 2),
                    humidity=round(humidity[i], 2),
                    ph=round(ph[i], 2),
                    rainfall=round(rainfall[i], 2),
                    label=crop,
                )
            )
    df = pd.DataFrame(rows)
    return df.sample(frac=1, random_state=RNG_SEED).reset_index(drop=True)


if __name__ == "__main__":
    out = generate()
    out.to_csv("app/data/crop_dataset.csv", index=False)
    print(f"Wrote {len(out)} rows across {out['label'].nunique()} crops to app/data/crop_dataset.csv")
