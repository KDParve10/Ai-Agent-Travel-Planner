import pytest
from unittest.mock import AsyncMock, patch
from app.agents.orchestrator import Orchestrator

@pytest.mark.asyncio
async def test_full_pipeline_mocked():
    # Mock LLM response for constraint extraction
    mock_constraints_json = """
    {
        "destination_region": "France",
        "cities": ["Paris"],
        "duration_days": 2,
        "budget_total": 1000.0,
        "currency": "USD"
    }
    """
    
    # Mock LLM response for research
    mock_research_json = """
    {
        "activities": [
            {
                "id": "p01",
                "name": "Eiffel Tower",
                "city": "Paris",
                "type": "sightseeing",
                "estimated_duration_mins": 120,
                "crowd_level": "high",
                "cost_band": "mid-range",
                "must_do": true,
                "rationale": "Iconic landmark"
            }
        ]
    }
    """
    
    # Mock LLM response for logistics
    mock_logistics_json = """
    {
        "lodging_plan": {
            "options": [{"id": "h01", "neighborhood": "Le Marais", "city": "Paris", "cost_band": "mid-range", "rationale": "Central"}],
            "nights_per_city": {"Paris": 1}
        },
        "movement_plan": {"legs": []},
        "day_skeletons": [
            {
                "day_number": 1,
                "city": "Paris",
                "slots": [{"time_slot": "Morning", "activity_id": "p01", "notes": "Visit Eiffel Tower"}]
            }
        ]
    }
    """
    
    # Mock LLM response for budget
    mock_budget_json = """
    {
        "stay_total": 200.0,
        "transport_total": 50.0,
        "food_total": 100.0,
        "activities_total": 50.0,
        "grand_total": 400.0,
        "within_budget": true,
        "violations": [],
        "suggested_swaps": []
    }
    """

    async def mock_generate_side_effect(prompt, system_prompt=None):
        if "Extract" in system_prompt or "extraction" in prompt.lower():
            return mock_constraints_json
        if "Research" in system_prompt:
            return mock_research_json
        if "Logistics" in system_prompt:
            return mock_logistics_json
        if "Budget" in system_prompt:
            return mock_budget_json
        if "Review" in system_prompt:
            return '{"is_qualitatively_valid": true, "preference_alignment": 1.0, "qualitative_issues": [], "repair_hints": []}'
        return "{}"

    with patch("app.services.llm.LLMService.generate_text", side_effect=mock_generate_side_effect):
        result = await Orchestrator.plan("2 days in Paris")
        
        # Verify result is a dict containing DraftItinerary and other info
        assert result["constraints"].duration_days == 2
        assert hasattr(result["draft"], "days")
        assert len(result["draft"].days) == 1
        assert result["draft"].budget_summary.grand_total == 400.0
