from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.schemas.models import TravelConstraints, BudgetBreakdown, DaySkeleton, ReviewReport

class PlanRequest(BaseModel):
    request: str = Field(..., description="The natural language travel request")

class PlanResponse(BaseModel):
    trace_id: str
    status: str = "success"
    constraints: TravelConstraints
    summary: str
    itinerary: List[DaySkeleton]
    budget_breakdown: BudgetBreakdown
    lodging_summary: str
    review_report: ReviewReport
    disclaimer: str = "This itinerary is AI-generated for planning support and may require manual verification for pricing, hotel availability, and local travel conditions."
    metadata: Dict[str, Any] = {}
