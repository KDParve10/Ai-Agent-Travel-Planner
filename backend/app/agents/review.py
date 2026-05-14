import json
import logging
from typing import List, Optional
from app.schemas.models import TravelConstraints, DraftItinerary, ReviewReport
from app.services.llm import llm_service
from app.core.logging import get_trace_id

logger = logging.getLogger(__name__)

REVIEW_SYSTEM_PROMPT = """
You are a Quality Review Agent for a travel planning system. 
Your task is to perform a qualitative review of a proposed Draft Itinerary against user constraints.

User Constraints:
- Preferences: {preferences}
- Avoidances: {avoidances}
- Budget: {budget_total} {currency}
- Cities: {cities}

Itinerary Summary:
{itinerary_summary}

Evaluation Rubric:
1. Preference Alignment: Does it include enough food and temple activities?
2. Crowd Avoidance: Does it avoid crowded areas or suggest off-peak times?
3. Logistics Realism: Is the pacing realistic? Is there enough travel time?
4. Narrative Coherence: Does the plan make sense as a story?

Return ONLY a valid JSON object matching this structure:
{{
  "preference_alignment": float (0.0 to 1.0),
  "is_qualitatively_valid": bool,
  "qualitative_issues": ["string"],
  "repair_hints": ["string"]
}}
"""

class ReviewAgent:
    @staticmethod
    async def run(constraints: TravelConstraints, itinerary: DraftItinerary) -> ReviewReport:
        trace_id = get_trace_id()
        logger.info(f"[TraceID: {trace_id}] ReviewAgent starting validation...")
        
        # Layer 1: Programmatic Validation
        report = ReviewAgent._programmatic_check(constraints, itinerary)
        
        # If programmatic checks failed critically (e.g. invalid structure), 
        # we might skip Layer 2. But here we'll proceed if it's just minor issues
        # to get full feedback. If it's totally broken, is_valid will be False.
        
        if not report.matching_duration or not report.cities_included:
            logger.warning(f"[TraceID: {trace_id}] Layer 1 critical failure. Skipping Layer 2 LLM check.")
            report.is_valid = False
            report.issues.append("Critical structural mismatch; qualitative review skipped.")
            return report

        # Layer 2: LLM Qualitative Review
        try:
            llm_result = await ReviewAgent._llm_check(constraints, itinerary)
            
            report.preference_alignment = llm_result.get("preference_alignment", 0.0)
            report.issues.extend(llm_result.get("qualitative_issues", []))
            report.repair_hints.extend(llm_result.get("repair_hints", []))
            
            # Final validity check
            if not llm_result.get("is_qualitatively_valid", True):
                report.is_valid = False
                
        except Exception as e:
            logger.error(f"[TraceID: {trace_id}] Layer 2 LLM check failed: {e}")
            report.issues.append(f"Qualitative review error: {str(e)}")
            report.is_valid = False # Fail safe
            
        return report

    @staticmethod
    def _programmatic_check(constraints: TravelConstraints, itinerary: DraftItinerary) -> ReviewReport:
        issues = []
        
        # 1. Duration check
        matching_duration = len(itinerary.days) == constraints.duration_days
        if not matching_duration:
            issues.append(f"Duration mismatch: expected {constraints.duration_days} days, got {len(itinerary.days)}")
            
        # 2. Cities check
        itinerary_cities = {d.city for d in itinerary.days}
        required_cities = set(constraints.cities)
        cities_included = required_cities.issubset(itinerary_cities)
        if not cities_included:
            missing = required_cities - itinerary_cities
            issues.append(f"Missing required cities: {', '.join(missing)}")
            
        # 3. Budget check
        budget_adherence = itinerary.budget_summary.grand_total <= constraints.budget_total
        if not budget_adherence:
            excess = itinerary.budget_summary.grand_total - constraints.budget_total
            issues.append(f"Over budget by {excess} {constraints.currency}")
            
        return ReviewReport(
            is_valid=matching_duration and cities_included and budget_adherence,
            matching_duration=matching_duration,
            cities_included=cities_included,
            budget_adherence=budget_adherence,
            preference_alignment=0.0, # Will be filled by Layer 2
            issues=issues,
            repair_hints=[]
        )

    @staticmethod
    async def _llm_check(constraints: TravelConstraints, itinerary: DraftItinerary) -> dict:
        # Create a condensed summary for the LLM
        days_summary = []
        for d in itinerary.days:
            slots = [f"{s.time_slot}: {s.notes}" for s in d.slots]
            days_summary.append(f"Day {d.day_number} ({d.city}): {', '.join(slots)}")
        
        itinerary_summary = "\n".join(days_summary)
        
        system_prompt = REVIEW_SYSTEM_PROMPT.format(
            preferences=", ".join(constraints.preferences),
            avoidances=", ".join(constraints.avoidances),
            budget_total=constraints.budget_total,
            currency=constraints.currency,
            cities=", ".join(constraints.cities),
            itinerary_summary=itinerary_summary
        )
        
        prompt = "Perform the qualitative review of the itinerary above and return the JSON report."
        
        response_text = await llm_service.generate_text(prompt, system_prompt=system_prompt)
        return ReviewAgent._parse_json(response_text)

    @staticmethod
    def _parse_json(text: str) -> dict:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3].strip()
        return json.loads(clean_text)
