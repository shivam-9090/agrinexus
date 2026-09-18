from app.ml import prefetch_disease_model


def test_prefetch_calls_get_pipeline(monkeypatch):
    called = False

    def fake_get_pipeline():
        nonlocal called
        called = True
        return lambda image: []

    monkeypatch.setattr(prefetch_disease_model, "_get_pipeline", fake_get_pipeline)
    prefetch_disease_model.prefetch()

    assert called is True
