import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from app.tools.router import ToolRouter

@pytest.mark.asyncio
async def test_search_cache():
    router = ToolRouter()
    router.tavily = MagicMock()
    router.tavily.search.return_value = {"results": [{"title": "Test"}]}
    
    # First call
    res1 = await router.search("test query")
    # Second call (should hit cache)
    res2 = await router.search("test query")
    
    assert res1 == res2
    assert router.tavily.search.call_count == 1

@pytest.mark.asyncio
async def test_fx_convert_success():
    router = ToolRouter()
    mock_response = {
        "rates": {"JPY": 150.0}
    }
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(status_code=200)
        mock_get.return_value.json.return_value = mock_response
        
        result = await router.fx_convert(100, "USD", "JPY")
        assert result == 15000.0

@pytest.mark.asyncio
async def test_fx_convert_fallback():
    router = ToolRouter()
    
    with patch("httpx.AsyncClient.get", side_effect=httpx.RequestError("Failed")):
        # Should return original amount as fallback
        result = await router.fx_convert(100, "USD", "JPY")
        assert result == 100.0

@pytest.mark.asyncio
async def test_price_band_logic():
    router = ToolRouter()
    price = await router.price_band("stay", "Tokyo", "mid-range")
    assert price == 150.0

@pytest.mark.asyncio
async def test_geo_estimate_stub():
    router = ToolRouter()
    res = await router.geo_estimate("Tokyo", "Kyoto")
    assert res["estimated_mins"] == 120
    assert res["provider"] == "stub"
