import joblib

from app.ml import train_crop_model


def test_load_real_dataset_has_expected_shape_and_columns():
    df = train_crop_model.load_real_dataset()
    assert df is not None
    assert list(df.columns) == train_crop_model.FEATURES + ["label"]
    assert len(df) == 2200
    assert df["label"].nunique() == 22


def test_load_real_dataset_returns_none_when_file_missing(monkeypatch, tmp_path):
    monkeypatch.setattr(train_crop_model, "REAL_DATASET_PATH", tmp_path / "missing.csv")
    assert train_crop_model.load_real_dataset() is None


def test_train_falls_back_to_synthetic_dataset_when_real_file_missing(monkeypatch, tmp_path):
    monkeypatch.setattr(train_crop_model, "REAL_DATASET_PATH", tmp_path / "missing.csv")
    monkeypatch.setattr(train_crop_model, "MODEL_PATH", tmp_path / "model.joblib")
    monkeypatch.setattr(train_crop_model, "DATASET_PATH", tmp_path / "dataset.csv")

    train_crop_model.train()

    bundle = joblib.load(tmp_path / "model.joblib")
    assert bundle["dataset_source"] == "synthetic:agronomic-range-seed"


def test_train_uses_real_dataset_when_present(monkeypatch, tmp_path):
    monkeypatch.setattr(train_crop_model, "MODEL_PATH", tmp_path / "model.joblib")
    monkeypatch.setattr(train_crop_model, "DATASET_PATH", tmp_path / "dataset.csv")

    train_crop_model.train()

    bundle = joblib.load(tmp_path / "model.joblib")
    assert bundle["dataset_source"] == "real:kaggle-crop-recommendation-dataset"
