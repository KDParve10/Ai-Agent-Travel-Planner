import pytest
from unittest.mock import AsyncMock, patch
from app.agents.research import DestinationResearchAgent
from app.agents.logistics import LogisticsAgent
from app.agents.budget import BudgetAgent
from app.schemas.models import TravelConstraints

@pytest.fixture
def mock_constraints():
    return TravelConstraints(
        destination_region="Japan",
        cities=["Tokyo", "Kyoto"],
        duration_days=5,
        budget_total=3000.0,
        currency="USD",
        preferences=["food", "temples"],
        avoidances=["crowds"]
    )

@pytest.mark.asyncio
async def test_research_agent_success(mock_constraints):
    mock_json = {
        "activities": [
            {
                "id": "tky_01",
                "name": "Senso-ji",
                "city": "Tokyo",
                "type": "temple",
                "estimated_duration_mins": 90,
                "crowd_level": "high",
                "cost_band": "budget",
                "must_do": True,
                "rationale": "Historical site"
            }
        ]
    }
    
    with patch("app.agents.research.llm_service.generate_text", new_callable=AsyncMock) as mock_llm, \
         patch("app.agents.research.tool_router.search", new_callable=AsyncMock) as mock_search:
        mock_llm.return_value = f"```json\n{import_json_string(mock_json)}\n```"
        mock_search.return_value = [{"title": "Test Result", "snippet": "Test Snippet"}]
        
        catalog = await DestinationResearchAgent.run(mock_constraints)
        assert len(catalog.activities) == 1
        assert catalog.activities[0].name == "Senso-ji"

@pytest.mark.asyncio
async def test_logistics_agent_success(mock_constraints):
    mock_json = {
        "lodging_plan": {
            "options": [{"id": "lod_01", "neighborhood": "Shibuya", "city": "Tokyo", "cost_band": "mid-range", "rationale": "Central"}],
            "nights_per_city": {"Tokyo": 2, "Kyoto": 3}
        },
        "movement_plan": {
            "legs": [{"from_city": "Tokyo", "to_city": "Kyoto", "mode": "Shinkansen", "estimated_cost_usd": 130.0, "duration_mins": 140}]
        },
        "day_skeletons": [
            {"day_number": 1, "city": "Tokyo", "slots": [{"time_slot": "Morning", "activity_id": "tky_01", "notes": "Arrival"}]}
        ]
    }
    
    with patch("app.agents.logistics.llm_service.generate_text", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = f"```json\n{import_json_string(mock_json)}\n```"
        
        result = await LogisticsAgent.run(mock_constraints)
        assert result["lodging_plan"].nights_per_city["Tokyo"] == 2
        assert result["movement_plan"].legs[0].mode == "Shinkansen"

@pytest.mark.asyncio
async def test_budget_agent_success(mock_constraints):
    mock_json = {
        "stay_total": 1200.0,
        "transport_total": 500.0,
        "food_total": 600.0,
        "activities_total": 400.0,
        "grand_total": 2700.0,
        "within_budget": True
    }
    
    with patch("app.agents.budget.llm_service.generate_text", new_callable=AsyncMock) as mock_llm, \
         patch("app.agents.budget.tool_router.price_band", new_callable=AsyncMock) as mock_price:
        mock_llm.return_value = f"```json\n{import_json_string(mock_json)}\n```"
        mock_price.return_value = 150.0
        
        breakdown = await BudgetAgent.run(mock_constraints)
        assert breakdown.grand_total == 2700.0
        assert breakdown.within_budget is True

def import_json_string(data):
    import json
    return json.dumps(data)
