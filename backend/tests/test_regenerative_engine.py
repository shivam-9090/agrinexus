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
