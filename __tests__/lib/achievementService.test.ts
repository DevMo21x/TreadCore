import {
  type StoredAchievementDefinition,
  type getActiveAchievementDefinitions,
  type getUserEarnedAchievementIds,
  type awardAchievement,
} from '@/db/queries/achievements';
import {
  type getUserLifetimeTotals,
  type getUserWorkoutsInWindow,
  type getWorkoutStats,
} from '@/db/queries/workouts';
import { type AchievementRule, type WorkoutMetricMap } from '@/lib/achievements/types';
import { evaluateAchievementsAfterWorkout } from '@/lib/achievements';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks are required so vi.mock can read them during module initialization
const mockedDependencies = vi.hoisted(() => ({
  getActiveAchievementDefinitions: vi.fn<typeof getActiveAchievementDefinitions>(),
  getUserEarnedAchievementIds: vi.fn<typeof getUserEarnedAchievementIds>(),
  awardAchievement: vi.fn<typeof awardAchievement>(),
  getUserLifetimeTotals: vi.fn<typeof getUserLifetimeTotals>(),
  getWorkoutStats: vi.fn<typeof getWorkoutStats>(),
  getUserWorkoutsInWindow: vi.fn<typeof getUserWorkoutsInWindow>(),
}));

vi.mock('@/db/queries/achievements', () => ({
  getActiveAchievementDefinitions: mockedDependencies.getActiveAchievementDefinitions,
  getUserEarnedAchievementIds: mockedDependencies.getUserEarnedAchievementIds,
  awardAchievement: mockedDependencies.awardAchievement,
}));

vi.mock('@/db/queries/workouts', () => ({
  getUserLifetimeTotals: mockedDependencies.getUserLifetimeTotals,
  getWorkoutStats: mockedDependencies.getWorkoutStats,
  getUserWorkoutsInWindow: mockedDependencies.getUserWorkoutsInWindow,
}));

// Builds a complete metric map and allows targeted overrides per test
function createMetricMap(overrides: Partial<WorkoutMetricMap> = {}): WorkoutMetricMap {
  return {
    distance_km: 0,
    duration_min: 0,
    calories: 0,
    speed: 0,
    elevation_m: 0,
    xp: 0,
    sessions_count: 0,
    local_end_hour: 0,
    ...overrides,
  };
}

// Creates one rule with sensible defaults so each test only sets what matters
function createRule(
  overrides: Partial<AchievementRule> & Pick<AchievementRule, 'scope' | 'metric' | 'target_value'>
): AchievementRule {
  return {
    scope: overrides.scope,
    metric: overrides.metric,
    aggregation: overrides.aggregation ?? 'sum',
    comparison: overrides.comparison ?? 'gte',
    target_value: overrides.target_value,
    target_min: overrides.target_min ?? null,
    target_max: overrides.target_max ?? null,
    window_days: overrides.window_days ?? null,
  };
}

// Creates one stored definition row in the shape returned by query functions
function createDefinition(
  id: number,
  code: string,
  rules: AchievementRule[]
): StoredAchievementDefinition {
  return {
    id,
    code,
    name: code,
    description: code,
    image_url: `/badges/${code}.svg`,
    active: true,
    rules,
  };
}

// Reset all mock call history and return values between tests
beforeEach(() => {
  vi.clearAllMocks();
});

describe('evaluateAchievementsAfterWorkout', () => {
  it('fetches only needed scopes, ignores already earned achievements, and awards newly earned definitions', async () => {
    const definitions: StoredAchievementDefinition[] = [
      createDefinition(1, 'lifetime_distance', [
        createRule({ scope: 'lifetime', metric: 'distance_km', target_value: 10 }),
      ]),
      createDefinition(2, 'session_speed', [
        createRule({
          scope: 'session',
          metric: 'speed',
          aggregation: 'max',
          target_value: 8,
        }),
      ]),
      createDefinition(3, 'rolling_week_xp', [
        createRule({
          scope: 'rolling_window',
          metric: 'xp',
          target_value: 120,
          window_days: 7,
        }),
      ]),
      createDefinition(4, 'rolling_month_calories', [
        createRule({
          scope: 'rolling_window',
          metric: 'calories',
          target_value: 700,
          window_days: 30,
        }),
      ]),
      createDefinition(5, 'already_earned_distance', [
        createRule({
          scope: 'session',
          metric: 'distance_km',
          aggregation: 'max',
          target_value: 1,
        }),
      ]),
    ];

    mockedDependencies.getActiveAchievementDefinitions.mockResolvedValue(definitions);
    mockedDependencies.getUserEarnedAchievementIds.mockResolvedValue(new Set([5]));
    mockedDependencies.getUserLifetimeTotals.mockResolvedValue(
      createMetricMap({ distance_km: 12 })
    );
    mockedDependencies.getWorkoutStats.mockResolvedValue(
      createMetricMap({ speed: 9, distance_km: 2 })
    );
    mockedDependencies.getUserWorkoutsInWindow.mockImplementation(async (_userId, windowDays) => {
      if (windowDays === 7) {
        return createMetricMap({ xp: 150 });
      }

      if (windowDays === 30) {
        return createMetricMap({ calories: 600 });
      }

      return createMetricMap();
    });
    mockedDependencies.awardAchievement.mockResolvedValue(undefined);

    const awardedDefinitions = await evaluateAchievementsAfterWorkout(42, 9001, -4);

    expect(mockedDependencies.getActiveAchievementDefinitions).toHaveBeenCalledOnce();
    expect(mockedDependencies.getUserEarnedAchievementIds).toHaveBeenCalledWith(42);

    expect(mockedDependencies.getUserLifetimeTotals).toHaveBeenCalledWith(42, -4);
    expect(mockedDependencies.getWorkoutStats).toHaveBeenCalledWith(9001, -4);
    expect(mockedDependencies.getUserWorkoutsInWindow).toHaveBeenCalledTimes(2);
    expect(mockedDependencies.getUserWorkoutsInWindow).toHaveBeenCalledWith(42, 7, -4);
    expect(mockedDependencies.getUserWorkoutsInWindow).toHaveBeenCalledWith(42, 30, -4);

    expect(mockedDependencies.awardAchievement).toHaveBeenCalledTimes(3);
    expect(mockedDependencies.awardAchievement).toHaveBeenCalledWith(42, 1, 9001);
    expect(mockedDependencies.awardAchievement).toHaveBeenCalledWith(42, 2, 9001);
    expect(mockedDependencies.awardAchievement).toHaveBeenCalledWith(42, 3, 9001);
    expect(mockedDependencies.awardAchievement).not.toHaveBeenCalledWith(42, 4, 9001);
    expect(mockedDependencies.awardAchievement).not.toHaveBeenCalledWith(42, 5, 9001);

    expect(awardedDefinitions.map((definition) => definition.id)).toEqual([1, 2, 3]);
  });

  it('fetches each rolling window only once even when multiple definitions share the same day value', async () => {
    const definitions: StoredAchievementDefinition[] = [
      createDefinition(10, 'rolling_week_distance', [
        createRule({
          scope: 'rolling_window',
          metric: 'distance_km',
          target_value: 5,
          window_days: 7,
        }),
      ]),
      createDefinition(11, 'rolling_week_xp', [
        createRule({
          scope: 'rolling_window',
          metric: 'xp',
          target_value: 100,
          window_days: 7,
        }),
      ]),
    ];

    mockedDependencies.getActiveAchievementDefinitions.mockResolvedValue(definitions);
    mockedDependencies.getUserEarnedAchievementIds.mockResolvedValue(new Set());
    mockedDependencies.getUserWorkoutsInWindow.mockResolvedValue(
      createMetricMap({ distance_km: 9, xp: 180 })
    );
    mockedDependencies.awardAchievement.mockResolvedValue(undefined);

    const awardedDefinitions = await evaluateAchievementsAfterWorkout(7, 77, -4);

    expect(mockedDependencies.getUserLifetimeTotals).not.toHaveBeenCalled();
    expect(mockedDependencies.getWorkoutStats).not.toHaveBeenCalled();
    expect(mockedDependencies.getUserWorkoutsInWindow).toHaveBeenCalledTimes(1);
    expect(mockedDependencies.getUserWorkoutsInWindow).toHaveBeenCalledWith(7, 7, -4);

    expect(mockedDependencies.awardAchievement).toHaveBeenCalledTimes(2);
    expect(awardedDefinitions.map((definition) => definition.id)).toEqual([10, 11]);
  });

  it('does not fetch scope metrics when all active achievements are already earned', async () => {
    const definitions: StoredAchievementDefinition[] = [
      createDefinition(21, 'distance_done', [
        createRule({ scope: 'lifetime', metric: 'distance_km', target_value: 1 }),
      ]),
      createDefinition(22, 'session_done', [
        createRule({ scope: 'session', metric: 'speed', aggregation: 'max', target_value: 1 }),
      ]),
    ];

    mockedDependencies.getActiveAchievementDefinitions.mockResolvedValue(definitions);
    mockedDependencies.getUserEarnedAchievementIds.mockResolvedValue(new Set([21, 22]));

    const awardedDefinitions = await evaluateAchievementsAfterWorkout(5, 50, -4);

    expect(mockedDependencies.getUserLifetimeTotals).not.toHaveBeenCalled();
    expect(mockedDependencies.getWorkoutStats).not.toHaveBeenCalled();
    expect(mockedDependencies.getUserWorkoutsInWindow).not.toHaveBeenCalled();
    expect(mockedDependencies.awardAchievement).not.toHaveBeenCalled();
    expect(awardedDefinitions).toEqual([]);
  });
});
