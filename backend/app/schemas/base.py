from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import hashlib

class CostBand(str, Enum):
    BUDGET = "budget"
    MID_RANGE = "mid-range"
    LUXURY = "luxury"

class ActivityType(str, Enum):
    TEMPLE = "temple"
    FOOD = "food"
    CULTURE = "culture"
    NATURE = "nature"
    SHOPPING = "shopping"
    TRANSPORT = "transport"
    ATTRACTION = "attraction"
    SIGHTSEEING = "sightseeing"
    MUSEUM = "museum"
    PARK = "park"
    OTHER = "other"

class CrowdLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

def generate_stable_id(content: str) -> str:
    """Generates a deterministic ID based on content."""
    return hashlib.md5(content.encode()).hexdigest()[:8]
