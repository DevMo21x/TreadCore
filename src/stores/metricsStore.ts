import { create } from 'zustand';
import type { MetricRow } from '@/types';

/**
 * Simple in-memory metrics store.
 *
 * Stores the current session metrics entirely in RAM (no disk or database writes).
 * This is intended for live telemetry and UI consumption while a session is active.
 */

export interface SessionMetrics {
  elapsedSeconds: number;
  calories: number;
  distanceKm: number;
  elevationGainM: number;
  xp: number;
}

interface MetricsStore {
  metrics: SessionMetrics;
  /** Time-series telemetry captured during the current session */
  telemetry: MetricRow[];
  /** If set then the workoutId of the most recently finalized session whose telemetry is available in RAM */
  finalizedWorkoutId: number | null;
  /** Replace entire metrics snapshot */
  setMetrics: (m: Partial<SessionMetrics>) => void;
  /** Update a single metric by key */
  updateMetric: <K extends keyof SessionMetrics>(key: K, value: SessionMetrics[K]) => void;
  /** Return a copy of the current metrics snapshot */
  snapshot: () => SessionMetrics;
  /** Append a telemetry row to the in-memory time-series */
  pushTelemetry: (row: Omit<MetricRow, 'metricId'>) => void;
  /** Get a copy of the telemetry time-series */
  snapshotTelemetry: () => MetricRow[];
  /** Clear telemetry and finalized id */
  clearTelemetry: () => void;
  /** Mark the given workout id as the finalized one for which telemetry is stored */
  setFinalizedWorkoutId: (id: number) => void;
  /** Clear metrics back to zeros */
  clear: () => void;
}

const DEFAULT_METRICS: SessionMetrics = {
  elapsedSeconds: 0,
  calories: 0,
  distanceKm: 0,
  elevationGainM: 0,
  xp: 0,
};

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  metrics: { ...DEFAULT_METRICS },
  telemetry: [],
  finalizedWorkoutId: null,
  // Cap telemetry points to avoid unbounded memory growth (default 1 hour at 1s sampling)
  // This will keep the last N points.
  // Note: value kept as a const here but could be made configurable.
  // We will enforce the cap during pushTelemetry.

  setMetrics: (m) =>
    set({
      metrics: {
        ...get().metrics,
        ...m,
      },
    }),

  updateMetric: (key, value) =>
    set({
      metrics: {
        ...get().metrics,
        [key]: value,
      } as SessionMetrics,
    }),

  snapshot: () => ({ ...get().metrics }),

  pushTelemetry: (row) =>
    set((state) => {
      // Maximum number of telemetry points to retain in RAM. At 1s sampling,
      // 21600 points ~= 6 hours of data. This prevents unbounded memory growth
      // while retaining high-resolution telemetry for recent workouts
      const MAX_POINTS = 21600; // keep up to last 21600 seconds (6 hours)
      const nextId =
        state.telemetry.length > 0 ? state.telemetry[state.telemetry.length - 1].metricId + 1 : 1;
      const newRow: MetricRow = {
        metricId: nextId,
        elapsedSeconds: row.elapsedSeconds,
        speedKmh: row.speedKmh,
        inclinePct: row.inclinePct,
        distanceM: row.distanceM,
        recordedAt: row.recordedAt,
      };
      // Append the new point and if we exceed the cap then drop the oldest
      // points so we always keep the most recent `MAX_POINTS` entries.
      const appended = [...state.telemetry, newRow];
      if (appended.length > MAX_POINTS) {
        // Slice to the tail of the array preserves order (oldest->newest)
        return { telemetry: appended.slice(appended.length - MAX_POINTS) };
      }
      return { telemetry: appended };
    }),

  snapshotTelemetry: () => get().telemetry.slice(),

  clearTelemetry: () => set({ telemetry: [], finalizedWorkoutId: null }),

  setFinalizedWorkoutId: (id: number) => set({ finalizedWorkoutId: id }),

  clear: () => set({ metrics: { ...DEFAULT_METRICS } }),
}));

export default useMetricsStore;
