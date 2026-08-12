'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useMetricsStore,
  useNotificationStore,
  useTreadmillStore,
  useWorkoutStore,
} from '@/stores';
import {
  createWorkout,
  deleteWorkout,
  finalizeWorkout,
  fetchUserWeight,
} from '@/lib/actions/workout';
import { commandSpeed } from '@/lib/treadmill/control';

export function WorkoutOrchestrator({ userId }: Readonly<{ userId: number }>) {
  const speed = useTreadmillStore((s) => s.stableSpeed);
  const incline = useTreadmillStore((s) => s.stableIncline);

  const status = useWorkoutStore((s) => s.status);
  const workoutId = useWorkoutStore((s) => s.workoutId);
  const forfeitRequestNonce = useWorkoutStore((s) => s.forfeitRequestNonce);
  const elapsedSeconds = useWorkoutStore((s) => s.elapsedSeconds);
  const distanceKm = useWorkoutStore((s) => s.distanceKm);
  const calories = useWorkoutStore((s) => s.calories);
  const elevationGainM = useWorkoutStore((s) => s.elevationGainM);
  const xp = useWorkoutStore((s) => s.xp);
  const tick = useWorkoutStore((s) => s.tick);
  const start = useWorkoutStore((s) => s.start);
  const reset = useWorkoutStore((s) => s.reset);
  const markFinalized = useWorkoutStore((s) => s.markFinalized);
  const emergencyActive = useTreadmillStore((s) => s.emergencyActive);

  const setCooldownActive = useTreadmillStore((s) => s.setCooldownActive);
  const speedRef = useRef(speed);
  const inclineRef = useRef(incline);
  const workoutIdRef = useRef(workoutId);
  const elevationRef = useRef(elevationGainM);
  const prevXpRef = useRef(xp);
  const isForfeitingRef = useRef(false);
  const lastHandledForfeitRequestRef = useRef(forfeitRequestNonce);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    inclineRef.current = incline;
  }, [incline]);
  useEffect(() => {
    workoutIdRef.current = workoutId;
  }, [workoutId]);
  useEffect(() => {
    elevationRef.current = elevationGainM;
  }, [elevationGainM]);

  useEffect(() => {
    const previousXp = prevXpRef.current;
    prevXpRef.current = xp;

    if (xp <= previousXp) {
      return;
    }

    useNotificationStore.getState().push({
      type: 'xp',
      message: `+${xp - previousXp} XP`,
    });
  }, [xp]);

  // Tick interval - Advances local statistics every second
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      tick(speedRef.current, inclineRef.current);
      const snapshot = useMetricsStore.getState().snapshot();
      useMetricsStore.getState().pushTelemetry({
        elapsedSeconds: snapshot.elapsedSeconds,
        speedKmh: speedRef.current, // stable speed — noise-filtered
        inclinePct: inclineRef.current, // stable incline — noise-filtered
        distanceM: snapshot.distanceKm * 1000,
        recordedAt: Date.now(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, tick]);

  const handleStop = async () => {
    if (workoutId === null) {
      reset();
      return;
    }

    const avgSpeedKmh = elapsedSeconds > 0 ? distanceKm / (elapsedSeconds / 3600) : 0;

    const unlockedBadges = await finalizeWorkout(
      userId,
      workoutId,
      distanceKm,
      avgSpeedKmh,
      Math.round(calories),
      xp,
      elevationGainM
    );

    const { push } = useNotificationStore.getState();

    unlockedBadges.forEach((badge) => {
      push({
        type: 'badge',
        name: badge.name,
        description: badge.description,
        imagePath: badge.imagePath ?? null,
      });
    });

    useMetricsStore.getState().setFinalizedWorkoutId(workoutId);
    markFinalized();
    reset();
  };

  const handleForfeit = useCallback(async () => {
    if (isForfeitingRef.current) {
      return;
    }

    isForfeitingRef.current = true;

    try {
      const activeWorkoutId = useWorkoutStore.getState().workoutId;

      // First command the treadmill to stop so the belt halts immediately.
      try {
        await commandSpeed(0);
      } catch (error) {
        console.error('Failed to stop treadmill belt during workout forfeit', error);
      }

      // Always cancel cooldown when discarding a session.
      setCooldownActive(false);

      // If we already have a persisted workout row then delete it permanently.
      if (activeWorkoutId !== null) {
        try {
          await deleteWorkout(activeWorkoutId);
        } catch (error) {
          console.error('Failed to delete workout record during forfeit', error);
        }
      }

      // Clear in-memory aggregates and telemetry so no discarded data remains.
      useMetricsStore.getState().clear();
      useMetricsStore.getState().clearTelemetry();
      reset();
    } finally {
      isForfeitingRef.current = false;
    }
  }, [reset, setCooldownActive]);

  useEffect(() => {
    if (forfeitRequestNonce === lastHandledForfeitRequestRef.current) {
      return;
    }

    lastHandledForfeitRequestRef.current = forfeitRequestNonce;

    if (status !== 'running' && status !== 'paused') {
      return;
    }

    void handleForfeit().catch((error) => {
      console.error('Failed to forfeit active workout session', error);
    });
  }, [forfeitRequestNonce, handleForfeit, status]);

  // Auto-start when belt begins moving; auto-stop when belt comes to rest;
  // auto-resume when belt restarts after a pause
  // Track previous speed to detect true belt restart
  const prevSpeedRef = useRef(speed);

  useEffect(() => {
    const previousSpeed = prevSpeedRef.current;
    prevSpeedRef.current = speed;

    // Auto-start when belt begins moving
    if (speed > 0 && status === 'idle') {
      Promise.all([createWorkout(userId), fetchUserWeight(userId)])
        .then(([id, weight]) => start(id, 'free', weight))
        .catch(console.error);
    }

    // Auto-resume and restore speed if needed
    if (speed > 0 && status === 'paused' && previousSpeed < 0.5) {
      const { pausedSpeed } = useWorkoutStore.getState();
      const targetSpeed = pausedSpeed ?? 0;

      void commandSpeed(targetSpeed);
      speedRef.current = targetSpeed;
      useWorkoutStore.getState().resume();
      useWorkoutStore.setState({ pausedSpeed: null });
    }

    // If user changes speed manually after resume, clear pausedSpeed
    if (status === 'running') {
      const { pausedSpeed } = useWorkoutStore.getState();
      if (pausedSpeed !== null && Math.abs(speed - pausedSpeed) > 0.01) {
        useWorkoutStore.setState({ pausedSpeed: null });
      }
    }

    // Guard stop logic so pause-induced speed changes do not finalize workouts
    if (speed === 0 && status === 'running' && !isForfeitingRef.current) {
      void handleStop().catch((error) => {
        console.error('Failed to finalize workout after treadmill stop', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, incline, start, status, userId]);

  // E-stop bridge: when hardware triggers an emergency stop, pause the active workout
  // (preserving pausedSpeed for restoration on resume) and zero out the commanded speed
  // so UI state reflects reality. The hardware owns the emergency — we must not issue a
  // command back to it. Using pause rather than letting speed=0 finalize the session
  // means the user can resume once the e-stop clears.
  useEffect(() => {
    if (emergencyActive) {
      const currentStatus = useWorkoutStore.getState().status;
      const currentSpeed = useTreadmillStore.getState().stableSpeed;

      if (currentStatus === 'running') {
        setCooldownActive(false);
        useWorkoutStore.getState().pause(currentSpeed);
      }

      useTreadmillStore.getState().setStableSpeed(0);
    }
  }, [emergencyActive, setCooldownActive]);

  return null;
}
