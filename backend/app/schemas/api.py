from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: Optional[T] = None
    error: Optional[str] = None
    metadata: Optional[dict] = None
    trace_id: Optional[str] = None

class ErrorResponse(APIResponse[None]):
    status: str = "error"
    error: str
