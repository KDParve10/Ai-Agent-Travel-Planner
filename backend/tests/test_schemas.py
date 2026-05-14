import pytest
import json
import os
from pydantic import ValidationError
from app.schemas.models import (
    TravelConstraints, 
    Activity, 
    BudgetBreakdown, 
    ReviewReport,
    ActivityCatalog
)

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "japan_5d.json")

def test_travel_constraints_valid():
    data = {
        "destination_region": "Japan",
        "cities": ["Tokyo", "Kyoto"],
        "duration_days": 5,
        "budget_total": 3000.0,
        "currency": "USD",
        "preferences": ["food", "temples"],
        "avoidances": ["crowds"]
    }
    constraints = TravelConstraints(**data)
    assert constraints.destination_region == "Japan"
    assert len(constraints.cities) == 2

@pytest.mark.parametrize("invalid_data", [
    {"destination_region": "J", "cities": ["Tokyo"], "duration_days": 5, "budget_total": 100}, # Region too short
    {"destination_region": "Japan", "cities": [], "duration_days": 5, "budget_total": 100}, # No cities
    {"destination_region": "Japan", "cities": ["T"], "duration_days": 5, "budget_total": 100}, # City name too short
    {"destination_region": "Japan", "cities": ["Tokyo"], "duration_days": 0, "budget_total": 100}, # Non-positive duration
    {"destination_region": "Japan", "cities": ["Tokyo"], "duration_days": 32, "budget_total": 100}, # Duration too long (>31)
    {"destination_region": "Japan", "cities": ["Tokyo"], "duration_days": 5, "budget_total": -10}, # Negative budget
])
def test_travel_constraints_invalid(invalid_data):
    with pytest.raises(ValidationError):
        TravelConstraints(**invalid_data)

def test_activity_valid():
    data = {
        "id": "act_01",
        "name": "Tea Ceremony",
        "city": "Kyoto",
        "type": "culture",
        "estimated_duration_mins": 60,
        "crowd_level": "low",
        "cost_band": "mid-range",
        "must_do": True,
        "rationale": "Authentic experience"
    }
    activity = Activity(**data)
    assert activity.id == "act_01"
    assert activity.type == "culture"

def test_activity_invalid_enums():
    data = {
        "id": "act_01",
        "name": "Test",
        "city": "Test",
        "type": "invalid_type", # Invalid enum
        "estimated_duration_mins": 60,
        "crowd_level": "extreme", # Invalid enum
        "cost_band": "expensive", # Invalid enum
        "must_do": True,
        "rationale": "Test"
    }
    with pytest.raises(ValidationError):
        Activity(**data)

def test_golden_fixture_loading():
    with open(FIXTURE_PATH, "r") as f:
        fixture_data = json.load(f)
    
    constraints = TravelConstraints(**fixture_data["constraints"])
    assert constraints.duration_days == 5
    
    catalog = ActivityCatalog(activities=fixture_data["activities"])
    assert len(catalog.activities) == 2
    assert catalog.activities[0].id == "tky_food_01"
    
    budget = BudgetBreakdown(**fixture_data["budget"])
    assert budget.grand_total == 3000.0
    assert budget.within_budget is True

def test_review_report_validation():
    data = {
        "is_valid": True,
        "matching_duration": True,
        "cities_included": True,
        "budget_adherence": True,
        "preference_alignment": 0.85,
        "issues": [],
        "repair_hints": []
    }
    report = ReviewReport(**data)
    assert report.is_valid is True
    assert report.preference_alignment == 0.85

def test_review_report_boundary():
    data = {
        "is_valid": True,
        "matching_duration": True,
        "cities_included": True,
        "budget_adherence": True,
        "preference_alignment": 1.5, # Out of range (0-1)
        "issues": [],
        "repair_hints": []
    }
    with pytest.raises(ValidationError):
        ReviewReport(**data)
