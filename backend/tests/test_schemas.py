import pytest
from pydantic import ValidationError

from app.models.schemas import Location, SoilSample


def test_location_rejects_out_of_range_latitude():
    with pytest.raises(ValidationError):
        Location(latitude=200, longitude=0)


def test_location_rejects_out_of_range_longitude():
    with pytest.raises(ValidationError):
        Location(latitude=0, longitude=-200)


def test_location_accepts_boundary_values():
    loc = Location(latitude=-90, longitude=180)
    assert loc.latitude == -90


def test_soil_sample_rejects_negative_nutrients():
    with pytest.raises(ValidationError):
        SoilSample(nitrogen=-5, phosphorus=10, potassium=10, ph=6.5)


def test_soil_sample_rejects_ph_above_14():
    with pytest.raises(ValidationError):
        SoilSample(nitrogen=10, phosphorus=10, potassium=10, ph=15)


def test_soil_sample_organic_carbon_optional():
    soil = SoilSample(nitrogen=10, phosphorus=10, potassium=10, ph=6.5)
    assert soil.organic_carbon_pct is None
