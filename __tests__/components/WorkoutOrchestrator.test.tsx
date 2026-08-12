import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutOrchestrator } from '@/components/WorkoutOrchestrator';
import { deleteWorkout, finalizeWorkout } from '@/lib/actions/workout';
import { commandSpeed } from '@/lib/treadmill/control';
import {
  useMetricsStore,
  useNotificationStore,
  useTreadmillStore,
  useWorkoutStore,
} from '@/stores';

vi.mock('@/lib/actions/workout', () => ({
  createWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
  finalizeWorkout: vi.fn(),
  fetchUserWeight: vi.fn(),
}));

vi.mock('@/lib/treadmill/control', () => ({
  commandIncline: vi.fn(),
  commandSpeed: vi.fn(),
}));

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('WorkoutOrchestrator', () => {
  const mockedCommandSpeed = vi.mocked(commandSpeed);
  const mockedDeleteWorkout = vi.mocked(deleteWorkout);
  const mockedFinalizeWorkout = vi.mocked(finalizeWorkout);

  beforeEach(() => {
    vi.useFakeTimers();
    mockedCommandSpeed.mockReset();
    mockedCommandSpeed.mockImplementation(async (targetSpeed: number) => {
      if (targetSpeed === 0) {
        useTreadmillStore.setState({ speed: 0, stableSpeed: 0 });
      }
      return true;
    });
    mockedDeleteWorkout.mockReset();
    mockedDeleteWorkout.mockResolvedValue(undefined);
    mockedFinalizeWorkout.mockReset();
    mockedFinalizeWorkout.mockResolvedValue([]);

    useTreadmillStore.setState({
      speed: 0,
      incline: 0,
      stableSpeed: 0,
      stableIncline: 0,
      isRunning: false,
      emergencyActive: false,
      mqttConnected: false,
      cooldownActive: false,
    });

    useWorkoutStore.setState({
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
    });

    useMetricsStore.getState().clear();
    useMetricsStore.getState().clearTelemetry();
    useNotificationStore.getState().clear();
  });

  afterEach(() => {
    cleanup();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('pushes an xp notification with the positive delta when xp increases', () => {
    const pushSpy = vi.spyOn(useNotificationStore.getState(), 'push').mockReturnValue('toast-1');

    render(<WorkoutOrchestrator userId={1} />);

    act(() => {
      useWorkoutStore.setState({ xp: 5 });
    });

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledWith({
      type: 'xp',
      message: '+5 XP',
    });

    act(() => {
      useWorkoutStore.setState({ xp: 8 });
    });

    expect(pushSpy).toHaveBeenCalledTimes(2);
    expect(pushSpy).toHaveBeenLastCalledWith({
      type: 'xp',
      message: '+3 XP',
    });
  });

  it('does not push a notification when xp stays the same or resets to zero', () => {
    const pushSpy = vi.spyOn(useNotificationStore.getState(), 'push').mockReturnValue('toast-1');

    render(<WorkoutOrchestrator userId={1} />);

    act(() => {
      useWorkoutStore.setState({ xp: 4 });
    });

    expect(pushSpy).toHaveBeenCalledTimes(1);

    act(() => {
      useWorkoutStore.setState({ xp: 4 });
      useWorkoutStore.setState({ xp: 0 });
    });

    expect(pushSpy).toHaveBeenCalledTimes(1);
  });

  it('does not push on mount when the current xp is already non-zero', () => {
    useWorkoutStore.setState({ xp: 12 });

    const pushSpy = vi.spyOn(useNotificationStore.getState(), 'push').mockReturnValue('toast-1');

    render(<WorkoutOrchestrator userId={1} />);

    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('pushes one badge notification per unlocked badge after workout finalization', async () => {
    mockedFinalizeWorkout.mockResolvedValue([
      {
        name: 'First Mile',
        description: 'Completed your first mile.',
        imagePath: '/badges/first-mile.svg',
      },
      {
        name: 'Night Runner',
        description: 'Completed a workout after dark.',
        imagePath: null,
      },
    ]);

    useWorkoutStore.setState({
      status: 'running',
      workoutId: 42,
      elapsedSeconds: 600,
      distanceKm: 1.6,
      calories: 140,
      elevationGainM: 12,
      xp: 20,
    });

    const pushSpy = vi.spyOn(useNotificationStore.getState(), 'push').mockReturnValue('toast-1');

    render(<WorkoutOrchestrator userId={7} />);

    await flushMicrotasks();

    expect(mockedFinalizeWorkout).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(2);
    expect(pushSpy).toHaveBeenNthCalledWith(1, {
      type: 'badge',
      name: 'First Mile',
      description: 'Completed your first mile.',
      imagePath: '/badges/first-mile.svg',
    });
    expect(pushSpy).toHaveBeenNthCalledWith(2, {
      type: 'badge',
      name: 'Night Runner',
      description: 'Completed a workout after dark.',
      imagePath: null,
    });
  });

  it('does not push badge notifications when finalization returns no unlocked badges', async () => {
    mockedFinalizeWorkout.mockResolvedValue([]);

    useWorkoutStore.setState({
      status: 'running',
      workoutId: 42,
      elapsedSeconds: 600,
      distanceKm: 1.6,
      calories: 140,
      elevationGainM: 12,
      xp: 20,
    });

    const pushSpy = vi.spyOn(useNotificationStore.getState(), 'push').mockReturnValue('toast-1');

    render(<WorkoutOrchestrator userId={7} />);

    await flushMicrotasks();

    expect(mockedFinalizeWorkout).toHaveBeenCalledTimes(1);
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('does not push badge notifications when finalization throws', async () => {
    mockedFinalizeWorkout.mockRejectedValue(new Error('finalize failed'));

    useWorkoutStore.setState({
      status: 'running',
      workoutId: 42,
      elapsedSeconds: 600,
      distanceKm: 1.6,
      calories: 140,
      elevationGainM: 12,
      xp: 20,
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pushSpy = vi.spyOn(useNotificationStore.getState(), 'push').mockReturnValue('toast-1');

    render(<WorkoutOrchestrator userId={7} />);

    await flushMicrotasks();

    expect(mockedFinalizeWorkout).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('forfeits an active session by stopping the belt, deleting workout data and clearing in-memory state', async () => {
    useWorkoutStore.setState({
      status: 'running',
      workoutId: 501,
      elapsedSeconds: 420,
      distanceKm: 1.25,
      calories: 95,
      elevationGainM: 6,
      xp: 12,
    });
    useTreadmillStore.setState({ speed: 5, stableSpeed: 5, cooldownActive: true });

    useMetricsStore.getState().setMetrics({
      elapsedSeconds: 420,
      calories: 95,
      distanceKm: 1.25,
      elevationGainM: 6,
      xp: 12,
    });
    useMetricsStore.getState().pushTelemetry({
      elapsedSeconds: 420,
      speedKmh: 6,
      inclinePct: 2,
      distanceM: 1250,
      recordedAt: Date.now(),
    });

    render(<WorkoutOrchestrator userId={17} />);

    act(() => {
      useWorkoutStore.getState().requestForfeit();
    });
    await flushMicrotasks();

    expect(mockedCommandSpeed).toHaveBeenCalledWith(0);
    expect(mockedDeleteWorkout).toHaveBeenCalledWith(501);
    expect(mockedFinalizeWorkout).not.toHaveBeenCalled();
    expect(useWorkoutStore.getState().status).toBe('idle');
    expect(useTreadmillStore.getState().cooldownActive).toBe(false);
    expect(useMetricsStore.getState().snapshot()).toEqual({
      elapsedSeconds: 0,
      calories: 0,
      distanceKm: 0,
      elevationGainM: 0,
      xp: 0,
    });
    expect(useMetricsStore.getState().telemetry).toEqual([]);
  });

  it('forfeits cleanly without delete when workout identifier is not available yet', async () => {
    useWorkoutStore.setState({
      status: 'running',
      workoutId: null,
      elapsedSeconds: 30,
      distanceKm: 0.1,
      calories: 8,
      elevationGainM: 1,
      xp: 1,
    });
    useTreadmillStore.setState({ speed: 5, stableSpeed: 5 });

    render(<WorkoutOrchestrator userId={17} />);

    act(() => {
      useWorkoutStore.getState().requestForfeit();
    });
    await flushMicrotasks();

    expect(mockedCommandSpeed).toHaveBeenCalledWith(0);
    expect(mockedDeleteWorkout).not.toHaveBeenCalled();
    expect(mockedFinalizeWorkout).not.toHaveBeenCalled();
    expect(useWorkoutStore.getState().status).toBe('idle');
  });
});
