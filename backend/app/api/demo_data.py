from app.schemas.models import DraftItinerary, TravelConstraints, DaySkeleton, DaySlot, BudgetBreakdown, ReviewReport

MOCK_PLAN = DraftItinerary(
    constraints=TravelConstraints(
        destination_region="Japan",
        cities=["Tokyo", "Kyoto"],
        duration_days=5,
        budget_total=3000.0,
        preferences=["Food", "Temples"]
    ),
    days=[
        DaySkeleton(day_number=1, city="Tokyo", slots=[
            DaySlot(time_slot="Morning", notes="Arrive in Tokyo, explore Shibuya"),
            DaySlot(time_slot="Afternoon", notes="Meiji Jingu Shrine and Harajuku"),
            DaySlot(time_slot="Evening", notes="Shinjuku nightlife and dinner")
        ]),
        DaySkeleton(day_number=2, city="Tokyo", slots=[
            DaySlot(time_slot="Morning", notes="Tsukiji Outer Market breakfast"),
            DaySlot(time_slot="Afternoon", notes="Asakusa Senso-ji Temple"),
            DaySlot(time_slot="Evening", notes="Akihabara exploration")
        ])
    ],
    catalog_refs=[],
    lodging_summary="Stay in Shinjuku (Tokyo) and Gion (Kyoto).",
    budget_summary=BudgetBreakdown(
        stay_total=1200.0,
        transport_total=500.0,
        food_total=800.0,
        activities_total=400.0,
        grand_total=2900.0,
        within_budget=True
    ),
)

MOCK_REVIEW = ReviewReport(
    is_valid=True,
    matching_duration=True,
    cities_included=True,
    budget_adherence=True,
    preference_alignment=1.0,
)
