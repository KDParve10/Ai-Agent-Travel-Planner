import pytest
from unittest.mock import AsyncMock, patch
from app.agents.orchestrator import Orchestrator
from app.schemas.models import TravelConstraints
from pydantic import ValidationError

@pytest.mark.asyncio
async def test_extract_constraints_success():
    mock_response = """
    {
      "destination_region": "Japan",
      "cities": ["Tokyo", "Kyoto"],
      "duration_days": 5,
      "budget_total": 3000.0,
      "currency": "USD",
      "preferences": ["food", "temples"],
      "avoidances": ["crowds"],
      "hard_requirements": ["5 days"],
      "soft_preferences": ["Tokyo + Kyoto"]
    }
    """
    
    with patch("app.agents.orchestrator.llm_service.generate_text", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response
        
        user_request = "Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds."
        constraints = await Orchestrator.extract_constraints(user_request)
        
        assert isinstance(constraints, TravelConstraints)
        assert constraints.destination_region == "Japan"
        assert constraints.duration_days == 5
        assert "Tokyo" in constraints.cities
        assert "food" in constraints.preferences

@pytest.mark.asyncio
async def test_extract_constraints_with_repair():
    invalid_response = "{ invalid json }"
    valid_response = """
    {
      "destination_region": "Japan",
      "cities": ["Tokyo"],
      "duration_days": 3,
      "budget_total": 1000.0,
      "currency": "USD",
      "preferences": [],
      "avoidances": [],
      "hard_requirements": [],
      "soft_preferences": []
    }
    """
    
    with patch("app.agents.orchestrator.llm_service.generate_text", new_callable=AsyncMock) as mock_llm:
        # First call returns invalid, second returns valid
        mock_llm.side_effect = [invalid_response, valid_response]
        
        user_request = "3 days in Tokyo, $1000"
        constraints = await Orchestrator.extract_constraints(user_request)
        
        assert constraints.duration_days == 3
        assert mock_llm.call_count == 2

@pytest.mark.asyncio
async def test_extract_constraints_validation_failure():
    # Missing required field 'destination_region'
    invalid_pydantic_response = """
    {
      "cities": ["Tokyo"],
      "duration_days": 3,
      "budget_total": 1000.0
    }
    """
    
    with patch("app.agents.orchestrator.llm_service.generate_text", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = invalid_pydantic_response
        
        user_request = "3 days in Tokyo"
        with pytest.raises(ValidationError):
            await Orchestrator.extract_constraints(user_request)
        
        # Should have tried twice (initial + repair)
        assert mock_llm.call_count == 2
