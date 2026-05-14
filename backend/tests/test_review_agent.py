import pytest
from unittest.mock import AsyncMock, patch
from app.agents.review import ReviewAgent
from app.schemas.models import TravelConstraints, DraftItinerary, DaySkeleton, BudgetBreakdown

@pytest.fixture
def mock_data():
    constraints = TravelConstraints(
        destination_region="Japan",
        cities=["Tokyo", "Kyoto"],
        duration_days=2,
        budget_total=2000.0,
        currency="USD"
    )
    
    itinerary = DraftItinerary(
        constraints=constraints,
        days=[
            DaySkeleton(day_number=1, city="Tokyo", slots=[]),
            DaySkeleton(day_number=2, city="Kyoto", slots=[])
        ],
        catalog_refs=[],
        lodging_summary="Stay in Shibuya",
        budget_summary=BudgetBreakdown(
            stay_total=500, transport_total=200, food_total=200, 
            activities_total=100, grand_total=1000, within_budget=True
        )
    )
    return constraints, itinerary

@pytest.mark.asyncio
async def test_review_programmatic_pass(mock_data):
    constraints, itinerary = mock_data
    
    # Layer 2 Mock
    mock_llm_json = {
        "preference_alignment": 0.9,
        "is_qualitatively_valid": True,
        "qualitative_issues": [],
        "repair_hints": []
    }
    
    with patch("app.agents.review.llm_service.generate_text", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = f"```json\n{import_json_string(mock_llm_json)}\n```"
        
        report = await ReviewAgent.run(constraints, itinerary)
        
        assert report.is_valid is True
        assert report.matching_duration is True
        assert report.cities_included is True
        assert report.budget_adherence is True

@pytest.mark.asyncio
async def test_review_duration_mismatch(mock_data):
    constraints, itinerary = mock_data
    itinerary.days = itinerary.days[:1] # Remove one day
    
    report = await ReviewAgent.run(constraints, itinerary)
    
    assert report.is_valid is False
    assert report.matching_duration is False
    assert "Duration mismatch" in report.issues[0]

@pytest.mark.asyncio
async def test_review_over_budget(mock_data):
    constraints, itinerary = mock_data
    itinerary.budget_summary.grand_total = 3000.0 # Constraints say 2000.0
    
    # Layer 2 Mock
    mock_llm_json = {
        "preference_alignment": 0.5,
        "is_qualitatively_valid": True,
        "qualitative_issues": ["Too expensive"],
        "repair_hints": ["Cut down on hotels"]
    }
    
    with patch("app.agents.review.llm_service.generate_text", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = f"```json\n{import_json_string(mock_llm_json)}\n```"
        
        report = await ReviewAgent.run(constraints, itinerary)
        
        assert report.is_valid is False
        assert report.budget_adherence is False
        assert any("Over budget" in i for i in report.issues)

def import_json_string(data):
    import json
    return json.dumps(data)
