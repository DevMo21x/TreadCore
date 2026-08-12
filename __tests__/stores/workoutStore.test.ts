import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkoutStore } from '@/stores/workoutStore';

vi.mock('@/stores/metricsStore', () => ({
  useMetricsStore: {
    getState: () => ({
      clear: vi.fn(),
      clearTelemetry: vi.fn(),
      setMetrics: vi.fn(),
    }),
  },
}));

describe('workoutStore — pause and resume', () => {
  beforeEach(() => {
    // Reset to idle state before each test
    useWorkoutStore.getState().reset();
  });

  it('transitions from running to paused when pause is called', () => {
    useWorkoutStore.getState().start(1, 'free', 70);

    expect(useWorkoutStore.getState().status).toBe('running');

    useWorkoutStore.getState().pause(4);

    expect(useWorkoutStore.getState().status).toBe('paused');
  });

  it('preserves all metrics when pausing', () => {
    useWorkoutStore.getState().start(1, 'free', 70);

    // Simulate some metric accumulation by setting state directly
    useWorkoutStore.setState({
      elapsedSeconds: 120,
      distanceKm: 1.5,
      calories: 80,
      elevationGainM: 25,
      xp: 15,
    });

    useWorkoutStore.getState().pause(4);

    const state = useWorkoutStore.getState();
    expect(state.status).toBe('paused');
    expect(state.elapsedSeconds).toBe(120);
    expect(state.distanceKm).toBe(1.5);
    expect(state.calories).toBe(80);
    expect(state.elevationGainM).toBe(25);
    expect(state.xp).toBe(15);
  });

  it('transitions from paused to running when resume is called', () => {
    useWorkoutStore.getState().start(1, 'free', 70);
    useWorkoutStore.getState().pause(4);

    expect(useWorkoutStore.getState().status).toBe('paused');

    useWorkoutStore.getState().resume();

    expect(useWorkoutStore.getState().status).toBe('running');
  });

  it('resets lastTickTime to the current moment when resuming to prevent phantom time deltas', () => {
    useWorkoutStore.getState().start(1, 'free', 70);

    const tickTimeAtStart = useWorkoutStore.getState().lastTickTime;

    useWorkoutStore.getState().pause(4);

    // Simulate a time gap by advancing the clock concept
    const beforeResume = Date.now();
    useWorkoutStore.getState().resume();
    const afterResume = Date.now();

    const resumedTickTime = useWorkoutStore.getState().lastTickTime!;
    expect(resumedTickTime).toBeGreaterThanOrEqual(beforeResume);
    expect(resumedTickTime).toBeLessThanOrEqual(afterResume);
  });

  it('does not accumulate metrics while paused (tick is a no-operation)', () => {
    useWorkoutStore.getState().start(1, 'free', 70);

    // Run a tick to get some baseline values
    useWorkoutStore.getState().tick(5, 0);
    const metricsBeforePause = {
      elapsedSeconds: useWorkoutStore.getState().elapsedSeconds,
      distanceKm: useWorkoutStore.getState().distanceKm,
      calories: useWorkoutStore.getState().calories,
    };

    useWorkoutStore.getState().pause(4);

    // Calling tick while paused should not change anything
    useWorkoutStore.getState().tick(5, 0);
    useWorkoutStore.getState().tick(5, 0);

    expect(useWorkoutStore.getState().elapsedSeconds).toBe(metricsBeforePause.elapsedSeconds);
    expect(useWorkoutStore.getState().distanceKm).toBe(metricsBeforePause.distanceKm);
    expect(useWorkoutStore.getState().calories).toBe(metricsBeforePause.calories);
  });

  it('keeps workoutId and session data intact while paused', () => {
    useWorkoutStore.getState().start(42, 'preset', 75);
    useWorkoutStore.getState().pause(4);

    const state = useWorkoutStore.getState();
    expect(state.workoutId).toBe(42);
    expect(state.type).toBe('preset');
    expect(state.weightKg).toBe(75);
    expect(state.startedAt).not.toBeNull();
  });

  it('resets everything back to idle from a paused state', () => {
    useWorkoutStore.getState().start(1, 'free', 70);
    useWorkoutStore.setState({ elapsedSeconds: 60, distanceKm: 0.5 });
    useWorkoutStore.getState().pause(4);

    useWorkoutStore.getState().reset();

    const state = useWorkoutStore.getState();
    expect(state.status).toBe('idle');
    expect(state.workoutId).toBeNull();
    expect(state.elapsedSeconds).toBe(0);
    expect(state.distanceKm).toBe(0);
  });
});
