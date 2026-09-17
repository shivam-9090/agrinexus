from app.models.schemas import ClimateSnapshot, SoilSample
from app.services.regenerative_engine import recommend_practices, soil_health_score


def test_soil_health_score_high_for_balanced_soil():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=6.8, organic_carbon_pct=1.0)
    score = soil_health_score(soil)
    assert score >= 90


def test_soil_health_score_low_for_depleted_soil():
    soil = SoilSample(nitrogen=5, phosphorus=5, potassium=5, ph=4.0, organic_carbon_pct=0.1)
    score = soil_health_score(soil)
    assert score < 50


def test_low_nitrogen_triggers_legume_rotation_practice():
    soil = SoilSample(nitrogen=20, phosphorus=40, potassium=40, ph=6.5, organic_carbon_pct=1.0)
    practices = recommend_practices(soil, climate=None, current_crop="wheat", irrigation_available=True)
    assert any("legume" in p.practice.lower() for p in practices)
    assert practices[0].priority == "high"


def test_dry_climate_without_irrigation_triggers_moisture_practice():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=6.8, organic_carbon_pct=1.0)
    climate = ClimateSnapshot(
        source="test", avg_precipitation_mm_day=0.5, avg_temperature_c=28,
        soil_moisture_proxy_pct=20, period="test",
    )
    practices = recommend_practices(soil, climate=climate, current_crop=None, irrigation_available=False)
    assert any("mulch" in p.practice.lower() or "moisture" in p.practice.lower() for p in practices)


def test_irrigation_available_suppresses_dry_climate_practice():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=6.8, organic_carbon_pct=1.0)
    climate = ClimateSnapshot(
        source="test", avg_precipitation_mm_day=0.5, avg_temperature_c=28,
        soil_moisture_proxy_pct=50, period="test",
    )
    practices = recommend_practices(soil, climate=climate, current_crop="wheat", irrigation_available=True)
    assert not any("mulch" in p.practice.lower() for p in practices)


def test_alkaline_soil_triggers_gypsum_practice():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=8.5, organic_carbon_pct=1.0)
    practices = recommend_practices(soil, climate=None, current_crop=None, irrigation_available=True)
    assert any("gypsum" in p.practice.lower() for p in practices)


def test_acidic_soil_triggers_lime_practice():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=5.0, organic_carbon_pct=1.0)
    practices = recommend_practices(soil, climate=None, current_crop=None, irrigation_available=True)
    assert any("lime" in p.practice.lower() for p in practices)


def test_low_soil_moisture_proxy_triggers_contour_bunding():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=6.8, organic_carbon_pct=1.0)
    climate = ClimateSnapshot(
        source="test", avg_precipitation_mm_day=5.0, avg_temperature_c=25,
        soil_moisture_proxy_pct=15, period="test",
    )
    practices = recommend_practices(soil, climate=climate, current_crop="wheat", irrigation_available=True)
    assert any("contour" in p.practice.lower() or "check dam" in p.practice.lower() for p in practices)


def test_healthy_soil_with_legume_current_crop_yields_low_priority_fallback():
    soil = SoilSample(nitrogen=100, phosphorus=45, potassium=45, ph=6.8, organic_carbon_pct=1.2)
    practices = recommend_practices(soil, climate=None, current_crop="soybean", irrigation_available=True)
    assert len(practices) == 1
    assert practices[0].priority == "low"


def test_soil_health_score_missing_organic_carbon_uses_default():
    soil = SoilSample(nitrogen=90, phosphorus=40, potassium=40, ph=6.8, organic_carbon_pct=None)
    score = soil_health_score(soil)
    assert 0 <= score <= 100
