# AI Travel Planner — Phase-Wise Implementation Plan

This plan implements the multi-agent travel planning system across backend and frontend.

## Phase 0: Project Foundation
- **Backend (FastAPI)**: 
    - Initialize project, set up `.env`, logging, and `trace_id` middleware.
    - Implement `/health` and stub `/api/plan`.
- **Frontend (React)**: 
    - Initialize React/Vite project.
    - Set up folder structure and basic layout.

## Phase 1: Shared Models & Extraction
- **Schemas**: Define Pydantic/TypeScript types for `TravelConstraints`, `Itinerary`, etc.
- **Orchestrator A**: Implement LLM extraction of constraints from raw text.

## Phase 2: Tool Router & Services
- **Tool Router**: Implement interface for Search (Tavily/Serper) and Pricing stubs.
- **Service Layer**: Common utilities for geo-calculations and FX conversion.

## Phase 3: Worker Agent Development
- **Research Agent**: Attractions, food, and "crowd-avoidance" logic.
- **Logistics Agent**: Transit (Shinkansen), neighborhood mapping, and scheduling.
- **Budget Agent**: Category-wise cost estimation and swap suggestions.

## Phase 4: Orchestration & Synthesis
- **Parallel Pipeline**: Run workers concurrently.
- **Merge Engine**: Combine outputs into a single `DraftItinerary`.

## Phase 5: Quality Control (Review & Repair)
- **Review Agent**: Rubric-based validation (Budget, Duration, Pacing).
- **Repair Loop**: Implement logic to retry specific agents based on Review feedback.

## Phase 6: Frontend Integration
- **API Wiring**: Connect React to FastAPI.
- **Components**: Build `InputForm`, `ItineraryList`, and `BudgetChart`.
- **Loading & Errors**: Implement shimmer states and error boundaries.

## Phase 7: Hardening & Polish
- **Timeouts**: Add per-agent timeouts and partial failure handling.
- **Observability**: Ensure traces are logged end-to-end.
- **Final UI**: Responsive design and accessibility audit.

## Phase 8: Deployment
- **Docker**: Containerize backend.
- **CI/CD**: Set up automated deployments for frontend and backend.
