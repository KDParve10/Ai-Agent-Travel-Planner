import json
import logging
from typing import List
from app.schemas.models import TravelConstraints, ActivityCatalog, Activity
from app.schemas.base import generate_stable_id
from app.services.llm import llm_service
from app.tools.router import tool_router
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

RESEARCH_SYSTEM_PROMPT = """
You are a Destination Research Agent. Your task is to recommend attractions, food areas, and neighborhoods based on travel constraints.

Constraints:
- Destination: {destination}
- Cities: {cities}
- Preferences: {preferences}
- Avoidances: {avoidances}

Requirements:
- Recommend 3-5 activities per city.
- Focus on {preferences} and avoid {avoidances}.
- Tag each activity with a cost band (budget, mid-range, luxury).
- Tag each activity with a crowd level (low, medium, high).
- Identify "must-do" items.
- Provide a clear rationale for each.

Return ONLY a valid JSON object matching the ActivityCatalog schema.
Example:
{{
  "activities": [
    {{
      "id": "str",
      "name": "str",
      "city": "str",
      "type": "temple|food|culture|nature|shopping|transport|attraction|sightseeing|museum|park|other",
      "estimated_duration_mins": int,
      "crowd_level": "low|medium|high",
      "cost_band": "budget|mid-range|luxury",
      "must_do": bool,
      "rationale": "str"
    }}
  ]
}}
"""

class DestinationResearchAgent:
    @staticmethod
    async def run(constraints: TravelConstraints) -> ActivityCatalog:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] DestinationResearchAgent starting...")
        
        # 1. Perform tool search
        search_queries = [
            f"best {', '.join(constraints.preferences)} in {city} avoiding {', '.join(constraints.avoidances)}"
            for city in constraints.cities
        ]
        
        search_context = ""
        for query in search_queries:
            results = await tool_router.search(query)
            for res in results[:3]:
                search_context += f"- {res.get('title')}: {res.get('snippet')}\n"

        # 2. Call LLM for synthesis
        prompt = f"Search Results Context:\n{search_context}\n\nPlease generate the ActivityCatalog JSON."
        system_prompt = RESEARCH_SYSTEM_PROMPT.format(
            destination=constraints.destination_region,
            cities=", ".join(constraints.cities),
            preferences=", ".join(constraints.preferences),
            avoidances=", ".join(constraints.avoidances)
        )
        
        try:
            response_text = await llm_service.generate_text(prompt, system_prompt=system_prompt)
            data = DestinationResearchAgent._parse_json(response_text)
            return ActivityCatalog(**data)
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] DestinationResearchAgent failed: {e}")
            raise e

    @staticmethod
    def _parse_json(text: str) -> dict:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3].strip()
        return json.loads(clean_text)
