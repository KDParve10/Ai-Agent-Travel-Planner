from fastapi import APIRouter, HTTPException, Query
from app.schemas.plan import PlanRequest, PlanResponse
from app.agents.orchestrator import Orchestrator
from app.core.logging import get_trace_id
from app.api.demo_data import MOCK_PLAN, MOCK_REVIEW
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/plan", response_model=PlanResponse)
async def generate_plan(payload: PlanRequest, demo: bool = Query(False)):
    """
    Main endpoint to generate a travel plan.
    """
    trace_id = get_trace_id()
    
    if demo:
        logger.info(f"[TraceID: {trace_id}] Demo mode triggered, returning mock plan.")
        return PlanResponse(
            trace_id=f"demo-{trace_id}",
            constraints=MOCK_PLAN.constraints,
            summary=f"Sample trip to {MOCK_PLAN.constraints.destination_region}",
            itinerary=MOCK_PLAN.days,
            budget_breakdown=MOCK_PLAN.budget_summary,
            lodging_summary=MOCK_PLAN.lodging_summary,
            review_report=MOCK_REVIEW
        )

    try:
        result = await Orchestrator.plan(payload.request)
        itinerary = result["draft"]
        
        # Wrap the result into PlanResponse
        return PlanResponse(
            trace_id=trace_id,
            constraints=result["constraints"],
            summary=f"Customized trip to {result['constraints'].destination_region}",
            itinerary=itinerary.days,
            budget_breakdown=itinerary.budget_summary,
            lodging_summary=itinerary.lodging_summary,
            review_report=result["review"],
            metadata={"repair_attempts": result.get("repair_attempts", 0)}
        )
    except Exception as e:
        logger.error(f"[TraceID: {trace_id}] Pipeline failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
