# Data provenance

`crop_recommendation.csv` is the "Crop Recommendation Dataset" originally
published on Kaggle by Atharva Ingle:
<https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset>

Downloaded on 2026-09-18 from a public GitHub mirror
(<https://github.com/gireesh777/Crop_Recommendation_System_using_ML>) since
the Kaggle page itself requires a browser session to fetch programmatically.
Verified after download: 2200 rows, 22 crop labels, 100 samples per crop,
columns `N,P,K,temperature,humidity,ph,rainfall,label` — matching the
dataset's known/published shape.

**License:** Kaggle's dataset page did not expose a machine-readable license
tag when checked (the page is client-rendered). This dataset is extremely
widely used in academic papers and ML tutorials without apparent
restriction, but if you plan to redistribute this repository commercially,
verify the license on the Kaggle page yourself before doing so — we are
not a substitute for that check.

This is real, published agronomic survey/lab data, not the synthetic
dataset in `../generate_dataset.py` (which remains in the repo as a
documented offline/no-internet fallback — see `train_crop_model.py`).
