import json
import logging
from app.schemas.models import TravelConstraints, BudgetBreakdown
from app.services.llm import llm_service
from app.tools.router import tool_router
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

BUDGET_SYSTEM_PROMPT = """
You are a Budget Agent. Your task is to calculate a realistic budget breakdown for a trip.

Constraints:
- Destination: {destination}
- Budget Cap: {budget_total} {currency}
- Duration: {duration} days

Requirements:
- Estimate costs for Stay, Transport, Food, and Activities.
- Determine if the total is within the budget cap.
- If over budget, provide violations and suggested swaps (e.g., "stay in cheaper area", "use local bus instead of taxi").

Return ONLY a valid JSON object matching this structure:
{{
  "stay_total": float,
  "transport_total": float,
  "food_total": float,
  "activities_total": float,
  "grand_total": float,
  "within_budget": bool,
  "violations": ["string"],
  "suggested_swaps": ["string"]
}}
"""

class BudgetAgent:
    @staticmethod
    async def run(constraints: TravelConstraints) -> BudgetBreakdown:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] BudgetAgent starting...")
        
        # 1. Fetch price bands for reference
        price_context = f"Mid-range Stay per night: {await tool_router.price_band('stay', 'any', 'mid-range')}\n"
        price_context += f"Mid-range Food per day: {await tool_router.price_band('food', 'any', 'mid-range')}\n"
        
        # 2. Call LLM
        prompt = f"Price Context:\n{price_context}\n\nCalculate budget for {constraints.destination_region} ({constraints.duration_days} days)."
        system_prompt = BUDGET_SYSTEM_PROMPT.format(
            destination=constraints.destination_region,
            budget_total=constraints.budget_total,
            currency=constraints.currency,
            duration=constraints.duration_days
        )
        
        try:
            response_text = await llm_service.generate_text(prompt, system_prompt=system_prompt)
            data = BudgetAgent._parse_json(response_text)
            return BudgetBreakdown(**data)
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] BudgetAgent failed: {e}")
            raise e

    @staticmethod
    def _parse_json(text: str) -> dict:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        return json.loads(clean_text)
