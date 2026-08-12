// =============================================================================
// SHARED TYPE DEFINITIONS
// =============================================================================
// Place your shared TypeScript types and interfaces in this file.
// Types that are used across multiple components or pages belong here.
//
// STUDENT: Add your own types as you build features. For example:
//   - User type for your auth system
//   - Product/Item types for your core data
//   - API response types
//
// Types specific to a single component can stay in that component's file.
// =============================================================================

/**
 * Standard API response wrapper.
 * Use this pattern to keep your API responses consistent.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard API error response.
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// =============================================================================
// WORKOUT TYPES
// =============================================================================

export interface WorkoutSummary {
  workoutId: number;
  startTime: string;
  endTime: string | null;
  totalDistanceKm: number;
  avgSpeedKmh: number;
  totalCalories: number;
  totalElevationGain: number;
  xpEarned: number;
}

export interface MetricRow {
  metricId: number;
  elapsedSeconds: number;
  speedKmh: number;
  inclinePct: number;
  distanceM: number;
  recordedAt: number;
}
