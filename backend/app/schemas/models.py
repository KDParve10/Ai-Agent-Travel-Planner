from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, PositiveInt, PositiveFloat
from app.schemas.base import CostBand, ActivityType, CrowdLevel

class TravelConstraints(BaseModel):
    destination_region: str = Field(..., min_length=2)
    cities: List[str] = Field(..., min_length=1)
    duration_days: PositiveInt = Field(..., le=31) # Max 1 month for this system
    budget_total: float = Field(..., ge=0)
    currency: str = "USD"
    preferences: List[str] = []
    avoidances: List[str] = []
    hard_requirements: List[str] = []
    soft_preferences: List[str] = []
    
    @field_validator("cities")
    @classmethod
    def validate_cities(cls, v: List[str]) -> List[str]:
        if not all(len(city) >= 2 for city in v):
            raise ValueError("Each city name must be at least 2 characters long")
        return v

class Activity(BaseModel):
    id: str = Field(..., description="Stable ID for the activity")
    name: str
    city: str
    type: ActivityType
    estimated_duration_mins: PositiveInt
    crowd_level: CrowdLevel
    cost_band: CostBand
    must_do: bool = False
    rationale: str

class ActivityCatalog(BaseModel):
    activities: List[Activity]

class LodgingOption(BaseModel):
    id: str
    neighborhood: str
    city: str
    cost_band: CostBand
    rationale: str

class LodgingPlan(BaseModel):
    options: List[LodgingOption]
    nights_per_city: Dict[str, int]

class Movement(BaseModel):
    from_city: str
    to_city: str
    mode: str # e.g., "Shinkansen", "Bus"
    estimated_cost_usd: float
    duration_mins: PositiveInt

class MovementPlan(BaseModel):
    legs: List[Movement]

class DaySlot(BaseModel):
    time_slot: str # e.g., "Morning", "Afternoon", "Evening"
    activity_id: Optional[str] = None
    notes: str

class DaySkeleton(BaseModel):
    day_number: PositiveInt
    city: str
    slots: List[DaySlot]

class BudgetBreakdown(BaseModel):
    stay_total: float = 0.0
    transport_total: float = 0.0
    food_total: float = 0.0
    activities_total: float = 0.0
    grand_total: float
    within_budget: bool
    violations: List[str] = []
    suggested_swaps: List[str] = []

class DraftItinerary(BaseModel):
    constraints: TravelConstraints
    days: List[DaySkeleton]
    catalog_refs: List[str] # List of activity IDs used
    lodging_summary: str
    budget_summary: BudgetBreakdown

class ReviewReport(BaseModel):
    is_valid: bool
    matching_duration: bool
    cities_included: bool
    budget_adherence: bool
    preference_alignment: float = Field(..., ge=0, le=1) # 0.0 to 1.0
    issues: List[str] = []
    repair_hints: List[str] = []
