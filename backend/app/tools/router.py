import logging
import httpx
import asyncio
from typing import Optional, Dict, Any, List
from tavily import TavilyClient
from cachetools import TTLCache
from app.core.config import settings
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

class ToolRouter:
    def __init__(self):
        self.tavily = None
        if settings.TAVILY_API_KEY:
            self.tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
        
        # TTL Cache: 100 items, 1 hour (3600s) TTL
        self._cache = TTLCache(maxsize=100, ttl=3600)
        self.timeout = 10.0 # Default timeout in seconds

    async def search(self, query: str, search_depth: str = "smart") -> List[Dict[str, Any]]:
        trace_id = get_trace_id()
        cache_key = f"search:{query}:{search_depth}"
        
        if cache_key in self._cache:
            logger.info(f"[TraceID: {trace_id}] Cache hit for search: {query}")
            return self._cache[cache_key]

        if not self.tavily:
            logger.warning(f"[TraceID: {trace_id}] Tavily API key missing, returning empty results")
            return []

        try:
            logger.info(f"[TraceID: {trace_id}] Calling Tavily Search: {query}")
            # Tavily client is synchronous, so we run in a thread pool
            response = await asyncio.to_thread(
                self.tavily.search, 
                query=query, 
                search_depth=search_depth
            )
            results = response.get("results", [])
            self._cache[cache_key] = results
            return results
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] Tavily Search failed: {e}")
            return []

    async def fx_convert(self, amount: float, from_curr: str, to_curr: str) -> Optional[float]:
        trace_id = get_trace_id()
        cache_key = f"fx:{from_curr}:{to_curr}"
        
        if cache_key in self._cache:
            rate = self._cache[cache_key]
            logger.debug(f"[TraceID: {trace_id}] FX Cache hit for {from_curr}->{to_curr}")
            return amount * rate

        # Using a public exchange rate API (fallback to 1.0 if fails)
        url = f"https://open.er-api.com/v6/latest/{from_curr.upper()}"
        try:
            logger.info(f"[TraceID: {trace_id}] Calling FX API: {from_curr} to {to_curr}")
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                rates = data.get("rates", {})
                rate = rates.get(to_curr.upper())
                
                if rate:
                    self._cache[cache_key] = rate
                    return amount * rate
                return None
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] FX conversion failed: {e}")
            return amount # Graceful fallback to 1:1 if API fails

    async def geo_estimate(self, origin: str, destination: str) -> Dict[str, Any]:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] Estimating travel time: {origin} -> {destination}")
        
        # Stub for now - in production this would call Google Maps or similar
        return {
            "origin": origin,
            "destination": destination,
            "estimated_mins": 120, # Placeholder
            "distance_km": 500, # Placeholder
            "provider": "stub"
        }

    async def price_band(self, category: str, city: str, band: str) -> float:
        trace_id = get_trace_id()
        logger.debug(f"[TraceID: {trace_id}] Getting price band for {category} in {city} ({band})")
        
        # Static price bands for demo purposes
        bands = {
            "stay": {"budget": 50, "mid-range": 150, "luxury": 400},
            "food": {"budget": 20, "mid-range": 60, "luxury": 150},
            "activity": {"budget": 10, "mid-range": 50, "luxury": 200}
        }
        return bands.get(category, {}).get(band, 100.0)

tool_router = ToolRouter()
