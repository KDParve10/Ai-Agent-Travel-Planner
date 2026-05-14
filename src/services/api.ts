// ---------------------------------------------------------------------------
// Backward-compat shim.
// The real client lives in `@/lib/api`. This file only re-exports the public
// surface so any legacy imports continue to work.
// ---------------------------------------------------------------------------
export {
  generatePlan,
  generateItinerary,
  checkHealth,
  normalizePlanResponse,
  savePlanToStorage,
  getPlanFromStorage,
  apiFetch,
  API_URL,
} from '@/lib/api';
