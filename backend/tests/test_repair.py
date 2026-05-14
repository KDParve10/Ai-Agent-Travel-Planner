import pytest
from unittest.mock import AsyncMock, patch
from app.agents.orchestrator import Orchestrator
from app.schemas.models import TravelConstraints, DraftItinerary, ReviewReport, BudgetBreakdown

@pytest.mark.asyncio
async def test_repair_loop_fixes_budget():
    constraints = TravelConstraints(destination_region="Japan", cities=["Tokyo"], duration_days=1, budget_total=100.0)
    
    # 1. Initial draft is over budget
    initial_draft = DraftItinerary(
        constraints=constraints, days=[], catalog_refs=[], lodging_summary="",
        budget_summary=BudgetBreakdown(stay_total=200, transport_total=0, food_total=0, activities_total=0, grand_total=200, within_budget=False)
    )
    
    # 2. Review report flags it
    fail_report = ReviewReport(is_valid=False, matching_duration=True, cities_included=True, budget_adherence=False, preference_alignment=1.0, issues=["Over budget"])
    pass_report = ReviewReport(is_valid=True, matching_duration=True, cities_included=True, budget_adherence=True, preference_alignment=1.0)
    
    # 3. Repaired draft is within budget
    repaired_draft = DraftItinerary(
        constraints=constraints, days=[], catalog_refs=[], lodging_summary="",
        budget_summary=BudgetBreakdown(stay_total=80, transport_total=0, food_total=0, activities_total=0, grand_total=80, within_budget=True)
    )

    with patch("app.agents.orchestrator.Orchestrator.extract_constraints", new_callable=AsyncMock) as mock_extract, \
         patch("app.agents.orchestrator.Orchestrator._run_agents_parallel", new_callable=AsyncMock) as mock_run, \
         patch("app.agents.orchestrator.Orchestrator._merge_itinerary", new_callable=AsyncMock) as mock_merge, \
         patch("app.agents.review.ReviewAgent.run", new_callable=AsyncMock) as mock_review, \
         patch("app.agents.orchestrator.Orchestrator._repair_itinerary", new_callable=AsyncMock) as mock_repair:
        
        mock_extract.return_value = constraints
        mock_run.return_value = {}
        mock_merge.return_value = initial_draft
        
        # First review fails, second passes
        mock_review.side_effect = [fail_report, pass_report]
        mock_repair.return_value = repaired_draft

        result = await Orchestrator.plan("Japan")
        
        assert mock_repair.call_count == 1
        assert result["draft"].budget_summary.within_budget is True
        assert result["review"].is_valid is True

@pytest.mark.asyncio
async def test_repair_loop_max_retries():
    constraints = TravelConstraints(destination_region="Japan", cities=["Tokyo"], duration_days=1, budget_total=100.0)
    initial_draft = DraftItinerary(constraints=constraints, days=[], catalog_refs=[], lodging_summary="", budget_summary=BudgetBreakdown(stay_total=200, grand_total=200, within_budget=False))
    fail_report = ReviewReport(is_valid=False, matching_duration=True, cities_included=True, budget_adherence=False, preference_alignment=1.0, issues=["Still over budget"])

    with patch("app.agents.orchestrator.Orchestrator.extract_constraints", new_callable=AsyncMock) as mock_extract, \
         patch("app.agents.orchestrator.Orchestrator._run_agents_parallel", new_callable=AsyncMock) as mock_run, \
         patch("app.agents.orchestrator.Orchestrator._merge_itinerary", new_callable=AsyncMock) as mock_merge, \
         patch("app.agents.review.ReviewAgent.run", new_callable=AsyncMock) as mock_review, \
         patch("app.agents.orchestrator.Orchestrator._repair_itinerary", new_callable=AsyncMock) as mock_repair:
        
        mock_extract.return_value = constraints
        mock_run.return_value = {}
        mock_merge.return_value = initial_draft
        
        # Always fail review
        mock_review.return_value = fail_report
        mock_repair.return_value = initial_draft

        result = await Orchestrator.plan("Japan")
        
        # Max retries is 2, so it should call repair twice and review 3 times (initial + 2 repairs)
        assert mock_repair.call_count == 2
        assert mock_review.call_count == 3
        assert result["review"].is_valid is False
