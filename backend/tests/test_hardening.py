import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.agents.orchestrator import Orchestrator
from app.schemas.models import TravelConstraints

@pytest.mark.asyncio
async def test_agent_timeout_fallback():
    # Simulate a slow agent that exceeds the 25s internal timeout
    async def slow_run(*args, **kwargs):
        await asyncio.sleep(30)
        return {"should": "fail"}

    constraints = TravelConstraints(destination_region="Japan", cities=["Tokyo"], duration_days=1, budget_total=100)

    with patch("app.agents.research.DestinationResearchAgent.run", side_effect=slow_run), \
         patch("app.agents.logistics.LogisticsAgent.run", new_callable=AsyncMock) as mock_log, \
         patch("app.agents.budget.BudgetAgent.run", new_callable=AsyncMock) as mock_bud:
        
        mock_log.return_value = {"lodging_plan": {"nights_per_city": {}}, "day_skeletons": []}
        mock_bud.return_value = None
        
        # We call the internal parallel runner
        results = await Orchestrator._run_agents_parallel(constraints)
        
        # Research should be None due to timeout fallback
        assert results["research"] is None
        # Logistics should still succeed
        assert results["logistics"] is not None
        assert mock_log.call_count == 1

@pytest.mark.asyncio
async def test_fx_api_fallback():
    from app.tools.router import tool_router
    import httpx
    
    # Mock httpx to fail
    with patch("httpx.AsyncClient.get", side_effect=httpx.RequestError("API Down")):
        result = await tool_router.fx_convert(100, "USD", "JPY")
        # Should return original amount (100) as graceful fallback
        assert result == 100.0
