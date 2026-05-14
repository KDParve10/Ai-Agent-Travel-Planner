import asyncio
import json
import logging
from typing import Optional, Dict, Any, List
from pydantic import ValidationError
from app.agents.research import DestinationResearchAgent
from app.agents.logistics import LogisticsAgent
from app.agents.budget import BudgetAgent
from app.agents.review import ReviewAgent
from app.schemas.models import (
    TravelConstraints, DraftItinerary, ActivityCatalog, 
    LodgingPlan, MovementPlan, DaySkeleton, BudgetBreakdown, ReviewReport
)
from app.services.llm import llm_service
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """
You are a travel planning assistant. Your task is to extract structured travel constraints from a user's natural language request.

You MUST return a valid JSON object matching the following schema:
{
  "destination_region": "string",
  "cities": ["string"],
  "duration_days": int,
  "budget_total": float,
  "currency": "string",
  "preferences": ["string"],
  "avoidances": ["string"],
  "hard_requirements": ["string"],
  "soft_preferences": ["string"]
}

Guidelines:
- If a city is mentioned, include it in the 'cities' list.
- If no specific currency is mentioned, default to 'USD'.
- Extract preferences (things they love) and avoidances (things they hate/avoid).
- 'hard_requirements' are non-negotiable constraints.
- 'soft_preferences' are nice-to-haves.

Return ONLY the JSON object. No other text.
"""

REPAIR_SYSTEM_PROMPT = """
You are a Travel Plan Repair Agent. Your task is to fix issues in a Draft Itinerary based on a Review Report.

Original Constraints:
{constraints}

Current Draft:
{draft_summary}

Review Report:
{review_report}

Instructions:
- Address the blocking issues and warnings.
- Keep the overall structure but swap items, adjust budgets, or rebalance cities as suggested.
- Return a valid JSON object matching the DraftItinerary schema.
"""

class Orchestrator:
    MAX_REPAIR_RETRIES = 2

    @staticmethod
    async def plan(user_request: str) -> dict:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] Starting full planning pipeline...")
        
        # 1. Extraction
        constraints = await Orchestrator.extract_constraints(user_request)
        
        # 2. Parallel Worker Execution
        worker_results = await Orchestrator._run_agents_parallel(constraints)
        
        # 3. Initial Merge
        draft = await Orchestrator._merge_itinerary(constraints, worker_results)
        
        # 4. Review & Repair Loop
        retry_count = 0
        final_report = None
        
        while retry_count <= Orchestrator.MAX_REPAIR_RETRIES:
            logger.info(f"[TraceID: {trace_id}] Review cycle {retry_count + 1}...")
            final_report = await ReviewAgent.run(constraints, draft)
            
            if final_report.is_valid or not final_report.issues:
                logger.info(f"[TraceID: {trace_id}] Itinerary passed review.")
                break
                
            if retry_count < Orchestrator.MAX_REPAIR_RETRIES:
                logger.warning(f"[TraceID: {trace_id}] Review failed. Attempting repair {retry_count + 1}...")
                draft = await Orchestrator._repair_itinerary(constraints, draft, final_report)
                retry_count += 1
            else:
                logger.error(f"[TraceID: {trace_id}] Max repair retries reached. Returning best effort plan.")
                break
        
        return {
            "constraints": constraints,
            "draft": draft,
            "review": final_report
        }

    @staticmethod
    async def _repair_itinerary(constraints: TravelConstraints, draft: DraftItinerary, report: ReviewReport) -> DraftItinerary:
        trace_id = get_trace_id()
        
        # Create summaries for LLM
        draft_summary = f"Days: {len(draft.days)}, Total Cost: {draft.budget_summary.grand_total}\n"
        for d in draft.days:
            draft_summary += f"- Day {d.day_number} ({d.city}): {len(d.slots)} slots\n"
            
        system_prompt = REPAIR_SYSTEM_PROMPT.format(
            constraints=constraints.model_dump_json(),
            draft_summary=draft_summary,
            review_report=report.model_dump_json()
        )
        
        prompt = "Please repair the itinerary JSON to address the reported issues."
        
        try:
            response_text = await llm_service.generate_text(prompt, system_prompt=system_prompt)
            data = Orchestrator._parse_json_for_draft(response_text)
            # Ensure constraints are preserved in the repaired draft
            data["constraints"] = constraints.model_dump()
            return DraftItinerary(**data)
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] Repair attempt failed: {e}")
            return draft # Return unrepaired draft as fallback

    @staticmethod
    def _parse_json_for_draft(text: str) -> dict:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        return json.loads(clean_text)

    @staticmethod
    async def _run_agents_parallel(constraints: TravelConstraints) -> dict:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] Running worker agents in parallel (30s timeout)...")
        
        async def safe_run(agent_name, coro):
            try:
                # Per-agent internal timeout protection
                return await asyncio.wait_for(coro, timeout=25.0)
            except asyncio.TimeoutError:
                logger.error(f"[TraceID: {trace_id}] Agent {agent_name} timed out.")
                return None
            except Exception as e:
                logger.error(f"[TraceID: {trace_id}] Agent {agent_name} failed: {e}")
                return None

        # Execute in parallel with overall gate
        try:
            results = await asyncio.gather(
                safe_run("research", DestinationResearchAgent.run(constraints)),
                safe_run("logistics", LogisticsAgent.run(constraints)),
                safe_run("budget", BudgetAgent.run(constraints)),
                return_exceptions=False
            )
        except Exception as ge:
            logger.error(f"[TraceID: {trace_id}] Parallel execution gate failure: {ge}")
            results = [None, None, None]
        
        logger.info(f"[TraceID: {trace_id}] Parallel results: Research={results[0] is not None}, Logistics={results[1] is not None}, Budget={results[2] is not None}")
        
        return {
            "research": results[0],
            "logistics": results[1],
            "budget": results[2]
        }

    @staticmethod
    async def _merge_itinerary(constraints: TravelConstraints, results: dict) -> DraftItinerary:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] Merging agent outputs into DraftItinerary...")
        
        research: ActivityCatalog = results.get("research")
        logistics: dict = results.get("logistics") or {}
        budget: BudgetBreakdown = results.get("budget")
        
        lodging: LodgingPlan = logistics.get("lodging_plan")
        days: List[DaySkeleton] = logistics.get("day_skeletons") or []
        
        # Resolve activity IDs and links
        catalog_ids = [a.id for a in research.activities] if research else []
        
        # Final summary generation
        lodging_summary = f"Stays planned in {', '.join(lodging.nights_per_city.keys())}" if lodging else "No lodging info"
        
        return DraftItinerary(
            constraints=constraints,
            days=days,
            catalog_refs=catalog_ids,
            lodging_summary=lodging_summary,
            budget_summary=budget or BudgetBreakdown(
                stay_total=0, transport_total=0, food_total=0, 
                activities_total=0, grand_total=0, within_budget=False,
                violations=["Budget agent failed"]
            )
        )

    @staticmethod
    async def extract_constraints(user_request: str) -> TravelConstraints:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] Starting constraint extraction for: {user_request[:50]}...")
        
        prompt = f"User Request: {user_request}\n\nReturn the JSON extraction."
        
        try:
            response_text = await llm_service.generate_text(prompt, system_prompt=EXTRACTION_SYSTEM_PROMPT)
            logger.info(f"[TraceID: {trace_id}] Raw extraction response: {response_text}")
            return Orchestrator._parse_and_validate(response_text)
        except (ValueError, ValidationError) as e:
            logger.warning(f"[TraceID: {trace_id}] First extraction attempt failed: {e}. Retrying with repair prompt...")
            repair_prompt = f"The previous JSON was invalid. Error: {str(e)}\n\nCorrect JSON for: {user_request}"
            try:
                repair_response = await llm_service.generate_text(repair_prompt, system_prompt=EXTRACTION_SYSTEM_PROMPT)
                return Orchestrator._parse_and_validate(repair_response)
            except Exception as re:
                logger.error(f"[TraceID: {trace_id}] Extraction failed after retry: {re}")
                raise re

    @staticmethod
    def _parse_and_validate(text: str) -> TravelConstraints:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3].strip()
        try:
            data = json.loads(clean_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON: {e}")
        return TravelConstraints(**data)
