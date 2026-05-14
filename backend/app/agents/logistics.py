import json
import logging
from typing import List, Dict
from app.schemas.models import TravelConstraints, LodgingPlan, MovementPlan, DaySkeleton, DaySlot
from app.services.llm import llm_service
from app.tools.router import tool_router
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

LOGISTICS_SYSTEM_PROMPT = """
You are a Logistics Agent. Your task is to plan the movement, lodging areas, and day-by-day skeletons for a trip.

Constraints:
- Destination: {destination}
- Cities: {cities}
- Duration: {duration} days

Requirements:
- Suggest neighborhoods to stay in each city.
- Plan travel between cities (e.g., Shinkansen if in Japan).
- Create a day-by-day skeleton with slots (Morning, Afternoon, Evening).
- Minimize backtracking.
- Provide travel time estimates.

Return ONLY a valid JSON object matching this structure:
{{
  "lodging_plan": {{
    "options": [{{ "id": "str", "neighborhood": "str", "city": "str", "cost_band": "budget|mid-range|luxury", "rationale": "str" }}],
    "nights_per_city": {{ "CityName": int }}
  }},
  "movement_plan": {{
    "legs": [{{ "from_city": "str", "to_city": "str", "mode": "str", "estimated_cost_usd": float, "duration_mins": int }}]
  }},
  "day_skeletons": [{{
    "day_number": int,
    "city": "str",
    "slots": [{{ "time_slot": "Morning|Afternoon|Evening", "activity_id": "str|null", "notes": "str" }}]
  }}]
}}
"""

class LogisticsAgent:
    @staticmethod
    async def run(constraints: TravelConstraints) -> Dict[str, any]:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] LogisticsAgent starting...")
        
        # 1. Gather geo-spatial info (if needed)
        # For simplicity, we'll let the LLM handle most logic but we could call geo_estimate for city pairs
        
        # 2. Call LLM
        prompt = f"Plan logistics for a {constraints.duration_days}-day trip to {', '.join(constraints.cities)}."
        system_prompt = LOGISTICS_SYSTEM_PROMPT.format(
            destination=constraints.destination_region,
            cities=", ".join(constraints.cities),
            duration=constraints.duration_days
        )
        
        try:
            response_text = await llm_service.generate_text(prompt, system_prompt=system_prompt)
            data = LogisticsAgent._parse_json(response_text)
            
            # Validate components
            lodging = LodgingPlan(**data["lodging_plan"])
            movement = MovementPlan(**data["movement_plan"])
            days = [DaySkeleton(**d) for d in data["day_skeletons"]]
            
            return {
                "lodging_plan": lodging,
                "movement_plan": movement,
                "day_skeletons": days
            }
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] LogisticsAgent failed: {e}")
            raise e

    @staticmethod
    def _parse_json(text: str) -> dict:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        return json.loads(clean_text)
