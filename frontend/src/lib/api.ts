// ---------------------------------------------------------------------------
// Unified Frontend API Client
// ---------------------------------------------------------------------------
// Single source of truth for talking to the FastAPI backend.
// - Native fetch + AbortController (no axios dependency required)
// - Timeout handling (default 120s for multi-agent pipeline)
// - Exponential-backoff retry on network / 5xx (no retry on 4xx)
// - Structured typed errors (ApiError)
// - Debug logging gated to non-production builds
// - normalizePlanResponse preserves the existing UI contract
// ---------------------------------------------------------------------------

import {
  Activity,
  ApiError,
  ApiErrorCode,
  BackendDay,
  BackendDaySlot,
  BackendPlanResponse,
  ItineraryData,
  PlanRequest,
  PlanResponse,
} from '@/types';

// ---------- Config ----------

export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

const IS_DEV = process.env.NODE_ENV !== 'production';
const DEFAULT_TIMEOUT_MS = 120_000; // multi-agent pipeline can take up to ~60s
const DEFAULT_RETRIES = 2;

function debug(...args: unknown[]) {
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.log('[api]', ...args);
  }
}

function warn(...args: unknown[]) {
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.warn('[api]', ...args);
  }
}

// ---------- Error construction ----------

function makeError(
  message: string,
  code: ApiErrorCode,
  extras: Partial<ApiError> = {}
): ApiError {
  return { message, code, ...extras };
}

// ---------- Core fetch wrapper ----------

interface ApiFetchOptions {
  timeoutMs?: number;
  retries?: number;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: ApiFetchOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = opts;
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let attempt = 0;
  let lastError: ApiError | null = null;
  let backoff = 1_000;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      debug(`→ ${init.method ?? 'GET'} ${url} (attempt ${attempt + 1}/${retries + 1})`);
      if (init.body && IS_DEV) debug('payload:', init.body);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(init.headers ?? {}),
        },
      });

      clearTimeout(timer);

      const traceId =
        response.headers.get('X-Trace-ID') ?? response.headers.get('x-trace-id') ?? undefined;

      debug(`← ${response.status} ${url}`, traceId ? `trace_id=${traceId}` : '');

      // Parse body (tolerant)
      let data: unknown = null;
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          warn('Response was not valid JSON:', text.slice(0, 200));
          throw makeError('Malformed server response', 'PARSE_ERROR', {
            status: response.status,
            traceId,
            details: text.slice(0, 500),
          });
        }
      }

      if (!response.ok) {
        const serverError = (data as { error?: string; detail?: string; message?: string }) ?? {};
        const message =
          serverError.error ||
          serverError.detail ||
          serverError.message ||
          `Server returned ${response.status}`;

        // Don't retry 4xx
        if (response.status >= 400 && response.status < 500) {
          throw makeError(message, 'HTTP_ERROR', {
            status: response.status,
            traceId,
            details: data,
          });
        }

        // 5xx → retryable
        lastError = makeError(message, 'HTTP_ERROR', {
          status: response.status,
          traceId,
          details: data,
        });
        throw lastError;
      }

      return data as T;
    } catch (err) {
      clearTimeout(timer);

      // Normalize into ApiError
      let apiErr: ApiError;
      if (isApiError(err)) {
        apiErr = err;
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        apiErr = makeError(
          `Request timed out after ${Math.round(timeoutMs / 1000)}s. The AI pipeline may be under load.`,
          'TIMEOUT'
        );
      } else if (err instanceof TypeError) {
        // Native fetch throws TypeError on network/CORS failures
        apiErr = makeError(
          'Cannot reach backend. Ensure the FastAPI server is running on ' + API_URL + '.',
          'CONNECTION_ERROR',
          { details: String(err) }
        );
      } else {
        apiErr = makeError(
          err instanceof Error ? err.message : 'Unexpected error',
          'UNKNOWN_ERROR',
          { details: err }
        );
      }

      lastError = apiErr;

      const isRetryable =
        apiErr.code === 'CONNECTION_ERROR' ||
        apiErr.code === 'TIMEOUT' ||
        (apiErr.code === 'HTTP_ERROR' && (apiErr.status ?? 0) >= 500);

      if (attempt < retries && isRetryable) {
        warn(
          `attempt ${attempt + 1} failed (${apiErr.code}): ${apiErr.message}. retrying in ${backoff}ms`
        );
        await sleep(backoff);
        backoff *= 2;
        attempt += 1;
        continue;
      }

      throw apiErr;
    }
  }

  // Should be unreachable
  throw lastError ?? makeError('Unknown failure', 'UNKNOWN_ERROR');
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isApiError(v: unknown): v is ApiError {
  return (
    typeof v === 'object' &&
    v !== null &&
    'code' in (v as Record<string, unknown>) &&
    'message' in (v as Record<string, unknown>)
  );
}

// ---------- Backend → UI normalization ----------

function slotToActivity(slot: BackendDaySlot, city: string, index: number): Activity {
  return {
    name: slot.notes || slot.activity_id || `Activity ${index + 1}`,
    description: slot.notes || 'Travel activity',
    duration_hours: 2,
    cost_usd: 0,
    location: city,
    category: slot.time_slot || 'Activity',
  };
}

export function normalizePlanResponse(
  data: BackendPlanResponse | (Partial<ItineraryData> & BackendPlanResponse)
): ItineraryData {
  // If the response already looks like the UI shape, pass through
  const maybeUi = data as Partial<ItineraryData>;
  if (maybeUi.days && maybeUi.budget && maybeUi.review) {
    return {
      ...(maybeUi as ItineraryData),
      trace_id: data.trace_id ?? 'local-plan',
    };
  }

  const constraints = data.constraints ?? {};
  const budget = data.budget_breakdown ?? {};
  const review = data.review_report ?? {};

  const destination =
    maybeUi.destination ||
    constraints.destination_region ||
    (constraints.cities && constraints.cities[0]) ||
    'Your Trip';

  const cities = maybeUi.cities || constraints.cities || [];
  const durationDays =
    maybeUi.duration_days ||
    constraints.duration_days ||
    (data.itinerary?.length ?? 0);

  const budgetTotal = budget.grand_total ?? maybeUi.budget?.total ?? 0;

  const days: ItineraryData['days'] = (data.itinerary ?? []).map(
    (day: BackendDay, dayIndex: number) => {
      const dayNumber = day.day ?? day.day_number ?? dayIndex + 1;
      const city = day.city || cities[0] || destination;
      return {
        day: dayNumber,
        day_number: dayNumber,
        city,
        date: '',
        activities:
          day.activities ??
          (day.slots ?? []).map((slot, slotIndex) =>
            slotToActivity(slot, city, slotIndex)
          ),
        meals: {},
        lodging: data.lodging_summary || '',
        transport: '',
        notes: '',
      };
    }
  );

  return {
    trace_id: data.trace_id ?? 'local-plan',
    destination,
    cities,
    duration_days: durationDays,
    travelers: maybeUi.travelers ?? 1,
    constraints: {
      destination,
      cities,
      duration_days: durationDays,
      budget_usd: constraints.budget_total,
      preferences: constraints.preferences,
      avoids: constraints.avoidances,
    },
    days,
    logistics:
      maybeUi.logistics ?? {
        flights: [],
        ground_transport: [],
        visas: [],
        travel_insurance: data.lodging_summary,
      },
    budget: {
      accommodation: budget.stay_total ?? 0,
      transport: budget.transport_total ?? 0,
      meals: budget.food_total ?? 0,
      activities: budget.activities_total ?? 0,
      misc: 0,
      total: budgetTotal,
      currency: constraints.currency || '$',
      stay_total: budget.stay_total,
      transport_total: budget.transport_total,
      food_total: budget.food_total,
      activities_total: budget.activities_total,
      grand_total: budget.grand_total,
      within_budget: budget.within_budget,
      violations: budget.violations,
      suggested_swaps: budget.suggested_swaps,
      budget_usd: constraints.budget_total,
    },
    review: {
      score: Math.round((review.preference_alignment ?? 1) * 10),
      max_score: 10,
      feedback: review.issues ?? [],
      warnings: review.repair_hints ?? [],
      suggestions: [],
      passed: review.is_valid ?? true,
      is_valid: review.is_valid,
      matching_duration: review.matching_duration,
      cities_included: review.cities_included,
      budget_adherence: review.budget_adherence,
      preference_alignment: review.preference_alignment,
      issues: review.issues,
      repair_hints: review.repair_hints,
    },
    generated_at: maybeUi.generated_at ?? new Date().toISOString(),
    version: maybeUi.version ?? '1.0',
    summary: data.summary,
    disclaimer: data.disclaimer,
    metadata: data.metadata,
    lodging_summary: data.lodging_summary,
  };
}

// ---------- Public API functions ----------

/**
 * Generate an AI travel plan.
 * @param request Natural-language travel request
 * @param demo Use backend demo mode (mocked response, no LLM call)
 */
export async function generatePlan(
  request: string,
  demo = false
): Promise<PlanResponse> {
  const trimmed = request.trim();
  if (!trimmed) {
    throw makeError('Request cannot be empty', 'HTTP_ERROR', { status: 400 });
  }

  const raw = await apiFetch<BackendPlanResponse>(
    `/api/plan?demo=${demo}`,
    {
      method: 'POST',
      body: JSON.stringify({ request: trimmed }),
    },
    { timeoutMs: DEFAULT_TIMEOUT_MS, retries: DEFAULT_RETRIES }
  );

  if (!raw || typeof raw !== 'object') {
    throw makeError('Invalid response from server', 'PARSE_ERROR', { details: raw });
  }

  try {
    return normalizePlanResponse(raw);
  } catch (err) {
    warn('Schema normalization failed:', err);
    throw makeError('Server response did not match expected schema', 'PARSE_ERROR', {
      traceId: raw.trace_id,
      details: err instanceof Error ? err.message : err,
    });
  }
}

/** Backward-compat alias used by legacy Hero.tsx */
export async function generateItinerary(payload: PlanRequest): Promise<ItineraryData> {
  return generatePlan(payload.request, false);
}

export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>(
      '/api/health',
      { method: 'GET' },
      { timeoutMs: 5_000, retries: 0 }
    );
    return true;
  } catch (err) {
    warn('Health check failed:', err);
    return false;
  }
}

// ---------- Session storage helpers ----------

export function savePlanToStorage(traceId: string, plan: PlanResponse): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`plan:${traceId}`, JSON.stringify(plan));
    sessionStorage.setItem('itinerary', JSON.stringify(plan));
  } catch {
    // Storage may be unavailable (private mode / quota) — ignore
  }
}

export function getPlanFromStorage(traceId: string): PlanResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`plan:${traceId}`);
    return raw ? (JSON.parse(raw) as PlanResponse) : null;
  } catch {
    return null;
  }
}
