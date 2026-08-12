/**
 * Zustand store for managing active workout session metrics and lifecycle.
 *
 * This store tracks workout progress including elapsed time, distance, elevation gain,
 * calories burned, and XP earned. It uses the ACSM formula for calorie calculations and
 * applies distance-based multipliers for XP progression. All numeric metrics are updated
 * by periodic tick() calls driven by treadmill state changes.
 *
 * @module
 */

import { create } from 'zustand';
import { calculateCaloriesBurned, DEFAULT_WEIGHT_KG } from '@/lib/treadmill/calories';
import { useMetricsStore } from './metricsStore';

/**
 * Status of the current workout session.
 * - 'idle': No workout is running; counters are at 0.
 * - 'running': Workout is active; metrics are being accumulated via tick() calls.
 * - 'paused': Workout is temporarily suspended; metrics do not advance until the belt restart
 */
type WorkoutStatus = 'idle' | 'running' | 'paused';

/**
 * Type of workout being performed.
 * - 'free': Unstructured treadmill run with no predefined targets.
 * - 'preset': Structured workout following a predefined program.
 * - 'null': No workout in progress.
 */
type WorkoutType = 'free' | 'preset' | null;

/**
 * Represents the complete state of an active workout session.
 */
interface WorkoutState {
  /** Current status of the workout session. */
  status: WorkoutStatus;
  /** Type of workout being performed (free-form or preset program). */
  type: WorkoutType;
  /** Database row ID of the workout record, assigned when the workout is persisted on start. */
  workoutId: number | null;
  /** Timestamp (milliseconds since epoch) when the workout began; source of truth for elapsed time. */
  startedAt: number | null;
  /** Timestamp of the last tick() call; used to compute time deltas for metric accumulation. */
  lastTickTime: number | null;

  /** User body weight in kilograms; used by the ACSM formula to calculate calories burned. */
  weightKg: number | null;

  /** Elapsed time in seconds. Cached for UI re-renders; can be derived from startedAt. */
  elapsedSeconds: number;
  /** Calories burned during the workout, calculated using the ACSM formula. */
  calories: number;
  /** Total distance covered in kilometers. */
  distanceKm: number;
  /** Total elevation gain in meters, derived from incline angle and distance deltas. */
  elevationGainM: number;
  /** Experience points earned; multiplier increases with distance milestones (1, 2, 3, 4, 5 km). */
  xp: number;

  /** Timestamp when the workout was last finalized; used to trigger history re-fetch. */
  lastFinalizedAt: number | null;

  /** Speed at the moment of pause, for restoration on resume. */
  pausedSpeed: number | null;

  /** Monotonic counter used to request a session forfeit from orchestrator logic. */
  forfeitRequestNonce: number;

  /**
   * Starts a new workout session with the specified parameters.
   *
   * Initializes all metrics to 0 and records the start time. A DB record is created
   * separately and its ID is passed here.
   *
   * @param workoutId - Database row ID of the newly created workout record.
   * @param type - Type of workout (free-form or preset program).
   * @param weightKg - User body weight in kilograms for calorie calculations.
   */
  start: (workoutId: number, type: WorkoutType, weightKg: number) => void;
  /**
   * Updates workout metrics based on current treadmill speed and incline.
   *
   * Computes time delta since the last tick, then calculates distance, elevation,
   * calories (via ACSM formula), and XP (with distance-based multipliers).
   * Must be called frequently (e.g., every 100–500 ms) to accumulate metrics accurately.
   *
   * @param speed - Current treadmill speed in km/h.
   * @param incline - Current treadmill incline level (0–10).
   */
  tick: (speed: number, incline: number) => void;
  /**
   * Resets all workout metrics and returns to idle state.
   *
   * Clears elapsed time, distance, elevation, calories, XP, and session identifiers.
   * Typically called after a workout is finalized or when the user cancels a session.
   */
  reset: () => void;
  /**
   * Pauses the current workout session.
   *
   * Sets status to 'paused' so that the tick interval stops accumulating metrics.
   * The session record remains open and can be resumed when the belt restarts.
   *
   * @param speed - The current treadmill speed to cache for restoration.
   */
  pause: (speed: number) => void;
  /**
   * Resumes a paused workout session.
   *
   * Sets status back to 'running' and resets lastTickTime to the current moment
   * so that no phantom time delta is recorded from the pause period.
   */
  resume: () => void;
  /**
   * Marks the current workout as finalized and records the finalization timestamp.
   *
   * This timestamp is used to trigger a background re-fetch of the workout history,
   * ensuring the UI reflects the newly completed session.
   */
  markFinalized: () => void;

  /**
   * Requests permanent discard of the active workout session.
   *
   * The actual forfeit sequence is handled in WorkoutOrchestrator so hardware commands,
   * database changes and in-memory cleanup happen in one place.
   */
  requestForfeit: () => void;
}

/**
 * Zustand hook for accessing the workout session state store.
 *
 * Provides access to the current workout's metrics (time, distance, calories and experience points(XP))
 * and lifecycle actions (start, tick and reset). Use selectors to subscribe to specific metrics
 * to minimize re-renders.
 *
 * @returns The workout state store with metrics and lifecycle action methods.
 *
 * @example
 * const { status, elapsedSeconds, calories } = useWorkoutStore();
 * const startWorkout = useWorkoutStore((state) => state.start);
 */
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  status: 'idle',
  type: null,
  workoutId: null,
  startedAt: null,
  lastTickTime: null,
  weightKg: null,
  elapsedSeconds: 0,
  calories: 0,
  distanceKm: 0,
  elevationGainM: 0,
  xp: 0,
  lastFinalizedAt: null,
  pausedSpeed: null,
  forfeitRequestNonce: 0,

  markFinalized: () => set({ lastFinalizedAt: Date.now() }),

  requestForfeit: () =>
    set((state) => ({
      forfeitRequestNonce: state.forfeitRequestNonce + 1,
    })),

  /**
   * Pauses the current workout session.
   *
   * Sets status to 'paused' so that the tick interval stops accumulating metrics.
   * The session record remains open and can be resumed when the belt restarts.
   *
   * @param speed - The current treadmill speed to cache for restoration.
   */
  pause: (speed: number) => {
    set({
      status: 'paused',
      pausedSpeed: speed,
    });
  },

  resume: () => set({ status: 'running', lastTickTime: Date.now() }),

  start: (workoutId, type, weightKg: number | null) => {
    set({
      status: 'running',
      type,
      workoutId,
      weightKg,
      startedAt: Date.now(),
      lastTickTime: Date.now(),
      elapsedSeconds: 0,
      calories: 0,
      distanceKm: 0,
      elevationGainM: 0,
      xp: 0,
    });
    // Clear RAM metrics + telemetry at session start
    try {
      useMetricsStore.getState().clear();
      useMetricsStore.getState().clearTelemetry();
    } catch (e) {
      /* noop */
    }
  },

  tick: (speed, incline) =>
    set((state) => {
      if (state.status !== 'running' || !state.lastTickTime) return {};

      const now = Date.now();
      const deltaMs = now - state.lastTickTime;
      const deltaSeconds = deltaMs / 1000;

      const newElapsed = state.elapsedSeconds + deltaSeconds;

      const deltaDistanceKm = (speed / 3600) * deltaSeconds;
      const newDistanceKm = state.distanceKm + deltaDistanceKm;

      const deltaElevationM = deltaDistanceKm * 1000 * Math.sin((incline * Math.PI) / 180);
      const newElevationGainM = state.elevationGainM + deltaElevationM;

      // Calculate calories burned using ACSM formula
      const deltaCalories = calculateCaloriesBurned(
        speed,
        incline,
        deltaSeconds,
        state.weightKg ?? DEFAULT_WEIGHT_KG
      );
      const newCalories = state.calories + deltaCalories;

      // XP: distance milestone multipliers
      const multiplier =
        newDistanceKm >= 5
          ? 15
          : newDistanceKm >= 4
            ? 14
            : newDistanceKm >= 3
              ? 13
              : newDistanceKm >= 2
                ? 12
                : newDistanceKm >= 1
                  ? 11
                  : 10;
      const newXp = Math.floor(newDistanceKm * multiplier);

      const newMetrics = {
        elapsedSeconds: newElapsed,
        calories: newCalories,
        distanceKm: newDistanceKm,
        elevationGainM: newElevationGainM,
        xp: newXp,
      };

      // update RAM metrics for UI/telemetry consumers
      try {
        useMetricsStore.getState().setMetrics(newMetrics);
      } catch (e) {
        /* noop */
      }

      return {
        ...newMetrics,
        lastTickTime: now,
      };
    }),

  reset: () => {
    set({
      status: 'idle',
      type: null,
      workoutId: null,
      startedAt: null,
      lastTickTime: null,
      elapsedSeconds: 0,
      calories: 0,
      distanceKm: 0,
      elevationGainM: 0,
      xp: 0,
      weightKg: null,
      pausedSpeed: null,
    });
    try {
      // Clear only the aggregated metrics kept in memory. Do NOT clear the
      // telemetry buffer here because we may call `reset()` immediately
      // after finalizing a workout - WorkoutPanel.handleStop() sets the
      // finalized workout ID and then resets the session. If we cleared
      // telemetry here we would lose the just-captured time-series used by
      // `WorkoutDashboard` to render the chart for the finalized workout.
      useMetricsStore.getState().clear();
    } catch (e) {
      /* noop */
    }
  },
}));
