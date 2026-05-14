import logging
import sys
from contextvars import ContextVar
from typing import Optional

# Context variable to store trace ID for the current request
trace_id_var: ContextVar[Optional[str]] = ContextVar("trace_id", default=None)

class TraceIDFilter(logging.Filter):
    def filter(self, record):
        record.trace_id = trace_id_var.get() or "N/A"
        return True

def setup_logging(log_level: str = "INFO"):
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - [%(trace_id)s] - %(message)s"
    )
    handler.setFormatter(formatter)
    handler.addFilter(TraceIDFilter())
    
    logger.handlers = [handler]
    
    # Silence third-party loggers
    logging.getLogger("uvicorn.access").handlers = [handler]
    logging.getLogger("uvicorn.error").handlers = [handler]

def get_trace_id() -> str:
    return trace_id_var.get() or "N/A"

def set_trace_id(trace_id: str):
    trace_id_var.set(trace_id)
