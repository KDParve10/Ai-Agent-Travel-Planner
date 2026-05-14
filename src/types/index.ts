// ---------------------------------------------------------------------------
// Frontend Type Contract
// ---------------------------------------------------------------------------
// Two layers:
//   1. Backend* types: the RAW shape returned by FastAPI (PlanResponse).
//   2. UI-facing types (ItineraryData, DayPlan, ...): the normalized shape
//      consumed by existing components (DayCard, BudgetSidebar, etc.).
//
// The UI layer is preserved 1:1 to keep the premium design intact.
// ---------------------------------------------------------------------------

// ============ UI-facing types (consumed by components) ============

export interface TravelConstraints {
  destination?: string;
  cities?: string[];
  duration_days?: number;
  budget_usd?: number;
  travelers?: number;
  preferences?: string[];
  avoids?: string[];
  must_see?: string[];
}

export interface Activity {
  name: string;
  description: string;
  duration_hours: number;
  cost_usd: number;
  booking_link?: string;
  location: string;
  category: string;
}

export interface DayPlan {
  day_number?: number;
  day: number;
  city: string;
  date: string;
  activities: Activity[];
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  lodging: string;
  transport: string;
  notes: string;
}

// Backward-compat aliases for existing components
export type DaySkeleton = DayPlan;
export type DaySlot = Activity;

export interface BudgetBreakdown {
  accommodation: number;
  activities: number;
  transport: number;
  meals: number;
  misc: number;
  total: number;
  currency: string;

  // Backend mirror fields (for ReviewPanel / BudgetSidebar)
  stay_total?: number;
  transport_total?: number;
  food_total?: number;
  activities_total?: number;
  grand_total?: number;
  within_budget?: boolean;
  violations?: string[];
  suggested_swaps?: string[];
  budget_usd?: number;
}

export interface ReviewReport {
  score: number;
  max_score: number;
  feedback: string[];
  warnings: string[];
  suggestions: string[];
  passed: boolean;

  // Backend mirror fields
  is_valid?: boolean;
  matching_duration?: boolean;
  cities_included?: boolean;
  budget_adherence?: boolean;
  preference_alignment?: number;
  issues?: string[];
  repair_hints?: string[];
}

export interface Logistics {
  flights: {
    airline: string;
    flight_number: string;
    departure: string;
    arrival: string;
    cost_usd: number;
  }[];
  ground_transport: {
    type: string;
    route: string;
    cost_usd: number;
  }[];
  visas: string[];
  travel_insurance?: string;
}

export interface ItineraryData {
  trace_id: string;
  destination: string;
  cities: string[];
  duration_days: number;
  travelers: number;
  constraints: TravelConstraints;
  days: DayPlan[];
  logistics: Logistics;
  budget: BudgetBreakdown;
  review: ReviewReport;
  generated_at: string;
  version: string;

  // Optional pass-through fields from backend
  summary?: string;
  disclaimer?: string;
  metadata?: Record<string, unknown>;
  lodging_summary?: string;
}

export type PlanResponse = ItineraryData;

// ============ Backend raw types (from FastAPI PlanResponse) ============

export interface BackendConstraints {
  destination_region?: string;
  cities?: string[];
  duration_days?: number;
  budget_total?: number;
  currency?: string;
  preferences?: string[];
  avoidances?: string[];
  hard_requirements?: string[];
  soft_preferences?: string[];
}

export interface BackendDaySlot {
  time_slot?: string;
  activity_id?: string | null;
  notes?: string;
}

export interface BackendDay {
  day_number?: number;
  day?: number;
  city?: string;
  slots?: BackendDaySlot[];
  activities?: Activity[];
}

export interface BackendBudgetBreakdown {
  stay_total?: number;
  transport_total?: number;
  food_total?: number;
  activities_total?: number;
  grand_total?: number;
  within_budget?: boolean;
  violations?: string[];
  suggested_swaps?: string[];
}

export interface BackendReviewReport {
  is_valid?: boolean;
  matching_duration?: boolean;
  cities_included?: boolean;
  budget_adherence?: boolean;
  preference_alignment?: number;
  issues?: string[];
  repair_hints?: string[];
}

export interface BackendPlanResponse {
  trace_id: string;
  status?: string;
  constraints?: BackendConstraints;
  summary?: string;
  itinerary?: BackendDay[];
  budget_breakdown?: BackendBudgetBreakdown;
  lodging_summary?: string;
  review_report?: BackendReviewReport;
  disclaimer?: string;
  metadata?: Record<string, unknown>;
}

// ============ Request / Error shapes ============

export interface PlanRequest {
  request: string;
}

export type ApiErrorCode =
  | 'TIMEOUT'
  | 'CONNECTION_ERROR'
  | 'HTTP_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiError {
  message: string;
  code: ApiErrorCode;
  status?: number;
  traceId?: string;
  details?: unknown;
}
