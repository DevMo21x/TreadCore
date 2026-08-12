import { describe, it, expect, beforeEach } from 'vitest';
import { useMetricsStore } from '@/stores/metricsStore';

describe('metricsStore', () => {
  beforeEach(() => {
    useMetricsStore.getState().clear();
  });

  it('starts with default zeros', () => {
    const snap = useMetricsStore.getState().snapshot();
    expect(snap).toEqual({
      elapsedSeconds: 0,
      calories: 0,
      distanceKm: 0,
      elevationGainM: 0,
      xp: 0,
    });
  });

  it('updates and snapshots metrics', () => {
    useMetricsStore.getState().setMetrics({ elapsedSeconds: 12.5, distanceKm: 0.42 });
    const snap = useMetricsStore.getState().snapshot();
    expect(snap.elapsedSeconds).toBeCloseTo(12.5);
    expect(snap.distanceKm).toBeCloseTo(0.42);
  });

  it('updates single metric by key', () => {
    useMetricsStore.getState().updateMetric('xp', 123);
    expect(useMetricsStore.getState().snapshot().xp).toBe(123);
  });

  it('clears metrics', () => {
    useMetricsStore.getState().setMetrics({ calories: 50, xp: 10 });
    useMetricsStore.getState().clear();
    expect(useMetricsStore.getState().snapshot().calories).toBe(0);
    expect(useMetricsStore.getState().snapshot().xp).toBe(0);
  });
});
