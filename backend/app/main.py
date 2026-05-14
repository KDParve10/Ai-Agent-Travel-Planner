import uuid
import time
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.health import router as health_router
from app.api.routes.plan import router as plan_router
from app.core.config import settings
from app.core.logging import setup_logging, set_trace_id, get_trace_id

# Initialize logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error": exc.detail,
            "trace_id": get_trace_id()
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": "Internal server error",
            "trace_id": get_trace_id()
        },
    )

# Trace ID & Logging Middleware
@app.middleware("http")
async def app_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
    set_trace_id(trace_id)
    
    start_time = time.time()
    
    # Log request
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
    except Exception as e:
        # Re-raise to be caught by global handler
        raise e
        
    process_time = time.time() - start_time
    
    # Performance logging
    if process_time > 3.0:
        logger.warning(f"Slow request detected: {request.url.path} took {process_time:.2f}s")
    
    response.headers["X-Trace-ID"] = trace_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    
    return response

# Include Routers
app.include_router(health_router, prefix="/api", tags=["System"])
app.include_router(plan_router, prefix="/api", tags=["Planning"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
