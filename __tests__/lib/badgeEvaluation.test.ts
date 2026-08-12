import {
  getEarnedBadgesForUser,
  applyAggregation,
  computeMetricMap,
} from '@/lib/achievements/badgeEvaluation';
import {
  type AchievementDefinition,
  type CoreBadgeMetric,
  type WorkoutMetricMap,
} from '@/lib/achievements/types';
import { describe, expect, it } from 'vitest';

const coreBadgeMetricValues = [
  'distance_km',
  'duration_min',
  'calories',
  'speed',
  'elevation_m',
  'xp',
  'sessions_count',
  'local_end_hour',
] as const satisfies ReadonlyArray<CoreBadgeMetric>;

const coreBadgeMetricCoverageMap: Record<CoreBadgeMetric, true> = {
  distance_km: true,
  duration_min: true,
  calories: true,
  speed: true,
  elevation_m: true,
  xp: true,
  sessions_count: true,
  local_end_hour: true,
};

// These tests check how achievements are granted from workout metric values
describe('badgeEvaluation', () => {
  it('keeps CoreBadgeMetric values aligned with database metric keys', () => {
    expect(coreBadgeMetricValues).toEqual([
      'distance_km',
      'duration_min',
      'calories',
      'speed',
      'elevation_m',
      'xp',
      'sessions_count',
      'local_end_hour',
    ]);

    expect(Object.keys(coreBadgeMetricCoverageMap)).toEqual([...coreBadgeMetricValues]);
  });

  it('supports achievement evaluation for every CoreBadgeMetric value', () => {
    const totals: WorkoutMetricMap = {
      distance_km: 7.2,
      duration_min: 45,
      calories: 360,
      speed: 9.2,
      elevation_m: 150,
      xp: 420,
      sessions_count: 12,
      local_end_hour: 18,
    };

    const definitions: ReadonlyArray<AchievementDefinition> = coreBadgeMetricValues.map(
      (metric) => ({
        code: `metric_${metric}`,
        name: `Metric ${metric}`,
        description: `Achievement for ${metric}`,
        active: true,
        rules: [
          {
            scope: 'lifetime',
            metric,
            aggregation: 'sum',
            comparison: 'gte',
            target_value: totals[metric] - 1,
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      })
    );

    const earned = getEarnedBadgesForUser(totals, definitions);

    expect(earned).toHaveLength(coreBadgeMetricValues.length);
    expect(earned.map((achievement) => achievement.code)).toEqual(
      coreBadgeMetricValues.map((metric) => `metric_${metric}`)
    );

    for (const metric of coreBadgeMetricValues) {
      const found = earned.find((achievement) => achievement.code === `metric_${metric}`);
      expect(found?.achievedValue).toBe(totals[metric]);
    }
  });

  it('applies each aggregation operator consistently', () => {
    const totals: WorkoutMetricMap = {
      distance_km: 10,
    };

    const aggregationCases = [
      {
        code: 'sum_pass',
        aggregation: 'sum',
        comparison: 'gte',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'count_pass',
        aggregation: 'count',
        comparison: 'gte',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'max_pass',
        aggregation: 'max',
        comparison: 'gte',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'min_pass',
        aggregation: 'min',
        comparison: 'gte',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'gte_pass',
        aggregation: 'sum',
        comparison: 'gte',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'gt_pass',
        aggregation: 'sum',
        comparison: 'gt',
        targetValue: 9,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'eq_pass',
        aggregation: 'sum',
        comparison: 'eq',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'lte_pass',
        aggregation: 'sum',
        comparison: 'lte',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'lt_pass',
        aggregation: 'sum',
        comparison: 'lt',
        targetValue: 11,
        targetMin: null,
        targetMax: null,
        expected: true,
      },
      {
        code: 'between_pass',
        aggregation: 'sum',
        comparison: 'between',
        targetValue: 0,
        targetMin: 9,
        targetMax: 11,
        expected: true,
      },
      {
        code: 'gt_fail',
        aggregation: 'sum',
        comparison: 'gt',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: false,
      },
      {
        code: 'eq_fail',
        aggregation: 'sum',
        comparison: 'eq',
        targetValue: 9,
        targetMin: null,
        targetMax: null,
        expected: false,
      },
      {
        code: 'lte_fail',
        aggregation: 'sum',
        comparison: 'lte',
        targetValue: 9,
        targetMin: null,
        targetMax: null,
        expected: false,
      },
      {
        code: 'lt_fail',
        aggregation: 'sum',
        comparison: 'lt',
        targetValue: 10,
        targetMin: null,
        targetMax: null,
        expected: false,
      },
      {
        code: 'between_fail',
        aggregation: 'sum',
        comparison: 'between',
        targetValue: 0,
        targetMin: 11,
        targetMax: 12,
        expected: false,
      },
    ] as const;

    const definitions: ReadonlyArray<AchievementDefinition> = aggregationCases.map(
      (aggregationCase) => ({
        code: aggregationCase.code,
        name: aggregationCase.code,
        description: aggregationCase.code,
        active: true,
        rules: [
          {
            scope: 'lifetime',
            metric: 'distance_km',
            aggregation: aggregationCase.aggregation,
            comparison: aggregationCase.comparison,
            target_value: aggregationCase.targetValue,
            target_min: aggregationCase.targetMin,
            target_max: aggregationCase.targetMax,
            window_days: null,
          },
        ],
      })
    );

    const earnedCodes = new Set(
      getEarnedBadgesForUser(totals, definitions).map((achievement) => achievement.code)
    );

    for (const aggregationCase of aggregationCases) {
      expect(earnedCodes.has(aggregationCase.code)).toBe(aggregationCase.expected);
    }
  });

  it('returns an earned achievement when every rule is satisfied', () => {
    // The user has enough completed totals to pass the achievement rule
    const totals: WorkoutMetricMap = {
      distance_km: 7.2,
      duration_min: 45,
      calories: 360,
      speed: 9.2,
      elevation_m: 150,
      xp: 420,
      sessions_count: 12,
      local_end_hour: 18,
    };

    // This achievement requires atleast five total kilometres
    const definitions: ReadonlyArray<AchievementDefinition> = [
      {
        code: 'distance_starter',
        name: 'Distance Starter',
        description: 'Complete atleast five kilometres in total.',
        active: true,
        rules: [
          {
            scope: 'lifetime',
            metric: 'distance_km',
            aggregation: 'sum',
            comparison: 'gte',
            target_value: 5,
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      },
    ];

    expect(getEarnedBadgesForUser(totals, definitions)).toEqual([
      {
        ...definitions[0],
        achievedValue: 7.2,
      },
    ]);
  });

  it('returns no earned achievements when any rule is not satisfied', () => {
    // Distance passes but calories do not reach the required target
    const totals: WorkoutMetricMap = {
      distance_km: 7.2,
      duration_min: 45,
      calories: 360,
      speed: 9.2,
      elevation_m: 150,
      xp: 420,
      sessions_count: 12,
      local_end_hour: 18,
    };

    const definitions: ReadonlyArray<AchievementDefinition> = [
      {
        code: 'strict_goal',
        name: 'Strict Goal',
        description: 'Meet two requirements together.',
        active: true,
        rules: [
          {
            scope: 'lifetime',
            metric: 'distance_km',
            aggregation: 'sum',
            comparison: 'gte',
            target_value: 5,
            target_min: null,
            target_max: null,
            window_days: null,
          },
          {
            scope: 'lifetime',
            metric: 'calories',
            aggregation: 'sum',
            comparison: 'gte',
            target_value: 500,
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      },
    ];

    expect(getEarnedBadgesForUser(totals, definitions)).toEqual([]);
  });

  it('returns no earned achievements for between aggregation when boundaries are missing', () => {
    // A between rule is invalid unless both lower and upper boundaries are present
    const totals: WorkoutMetricMap = {
      speed: 9.2,
    };

    const definitions: ReadonlyArray<AchievementDefinition> = [
      {
        code: 'speed_window',
        name: 'Speed Window',
        description: 'Keep speed inside a range.',
        active: true,
        rules: [
          {
            scope: 'session',
            metric: 'speed',
            aggregation: 'max',
            comparison: 'between',
            target_value: 0,
            target_min: null,
            target_max: 10,
            window_days: null,
          },
        ],
      },
    ];

    expect(getEarnedBadgesForUser(totals, definitions)).toEqual([]);
  });

  it('uses the first rule metric for achieved value', () => {
    // The returned "achievedValue" reflects the first rule metric in the rule list
    const totals: WorkoutMetricMap = {
      sessions_count: 12,
      xp: 420,
    };

    const definitions: ReadonlyArray<AchievementDefinition> = [
      {
        code: 'consistency_builder',
        name: 'Consistency Builder',
        description: 'Build both attendance and experience.',
        active: true,
        rules: [
          {
            scope: 'lifetime',
            metric: 'sessions_count',
            aggregation: 'count',
            comparison: 'gte',
            target_value: 10,
            target_min: null,
            target_max: null,
            window_days: null,
          },
          {
            scope: 'lifetime',
            metric: 'xp',
            aggregation: 'sum',
            comparison: 'gte',
            target_value: 400,
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      },
    ];

    expect(getEarnedBadgesForUser(totals, definitions)).toEqual([
      {
        ...definitions[0],
        achievedValue: 12,
      },
    ]);
  });

  it('filters out achievements where active is false', () => {
    // Even if all rules pass, inactive achievements should not be returned
    const totals: WorkoutMetricMap = {
      distance_km: 7.2,
    };

    const definitions: ReadonlyArray<AchievementDefinition> = [
      {
        code: 'inactive_achievement',
        name: 'Inactive Achievement',
        description: 'This achievement is disabled.',
        active: false,
        rules: [
          {
            scope: 'lifetime',
            metric: 'distance_km',
            aggregation: 'sum',
            comparison: 'gte',
            target_value: 5,
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      },
    ];

    expect(getEarnedBadgesForUser(totals, definitions)).toEqual([]);
  });

  it('session scope returns the best single session value, not sum across sessions', () => {
    // Session scope should return the max metric value across individual sessions,
    // not sum or count across all sessions
    const workouts = [
      {
        workoutId: 1,
        startTime: '2026-04-01T08:00:00.000Z',
        endTime: '2026-04-01T08:45:00.000Z',
        totalDistanceKm: 5,
        avgSpeedKmh: 8,
        totalCalories: 300,
        totalElevationGain: 100,
        xpEarned: 200,
      },
      {
        workoutId: 2,
        startTime: '2026-04-10T09:00:00.000Z',
        endTime: '2026-04-10T09:30:00.000Z',
        totalDistanceKm: 3,
        avgSpeedKmh: 10,
        totalCalories: 200,
        totalElevationGain: 50,
        xpEarned: 150,
      },
    ];

    const definitions: ReadonlyArray<AchievementDefinition> = [
      {
        code: 'session_distance',
        name: 'Session Distance',
        description: 'Best single session distance.',
        active: true,
        rules: [
          {
            scope: 'session',
            metric: 'distance_km',
            aggregation: 'max',
            comparison: 'gte',
            target_value: 5,
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      },
      {
        code: 'session_distance_too_high',
        name: 'Session Distance Too High',
        description: 'Requires more than any single session achieved.',
        active: true,
        rules: [
          {
            scope: 'session',
            metric: 'distance_km',
            aggregation: 'max',
            comparison: 'gte',
            target_value: 9, // Total would be 8, but max single session is 5
            target_min: null,
            target_max: null,
            window_days: null,
          },
        ],
      },
    ];

    // Evaluate only the first definition with session scope
    const sessionDef = definitions[0];
    const totals = computeMetricMap(workouts, sessionDef.rules);

    // Session scope should return 5 (max of 5 and 3), not 8 (sum)
    expect(totals.distance_km).toBe(5);

    // Both definitions should be evaluated
    const earned = definitions.flatMap((def) => {
      const defTotals = computeMetricMap(workouts, def.rules);
      return getEarnedBadgesForUser(defTotals, [def]);
    });

    expect(earned).toHaveLength(1);
    expect(earned[0]?.code).toBe('session_distance');
    expect(earned[0]?.achievedValue).toBe(5);
  });

  it('session scope with min aggregation passes only when every session meets the floor', () => {
    // "Consistent Burner" — every session must burn at least 200 calories.
    // Session 1 burns 300, session 2 burns 200, so min is 200 — passes at ≥ 200.
    // A stricter target of 250 fails because session 2 only burned 200.
    const workouts = [
      {
        workoutId: 1,
        startTime: '2026-04-01T08:00:00.000Z',
        endTime: '2026-04-01T08:45:00.000Z',
        totalDistanceKm: 5,
        avgSpeedKmh: 8,
        totalCalories: 300,
        totalElevationGain: 100,
        xpEarned: 200,
      },
      {
        workoutId: 2,
        startTime: '2026-04-10T09:00:00.000Z',
        endTime: '2026-04-10T09:30:00.000Z',
        totalDistanceKm: 3,
        avgSpeedKmh: 10,
        totalCalories: 200,
        totalElevationGain: 50,
        xpEarned: 150,
      },
    ];

    const passDefinition: AchievementDefinition = {
      code: 'consistent_burner',
      name: 'Consistent Burner',
      description: 'Every session burns at least 200 calories.',
      active: true,
      rules: [
        {
          scope: 'session',
          metric: 'calories',
          aggregation: 'min',
          comparison: 'gte',
          target_value: 200,
          target_min: null,
          target_max: null,
          window_days: null,
        },
      ],
    };

    const failDefinition: AchievementDefinition = {
      code: 'consistent_burner_strict',
      name: 'Consistent Burner (Strict)',
      description: 'Every session burns at least 250 calories.',
      active: true,
      rules: [
        {
          scope: 'session',
          metric: 'calories',
          aggregation: 'min',
          comparison: 'gte',
          target_value: 250,
          target_min: null,
          target_max: null,
          window_days: null,
        },
      ],
    };

    const passTotals = computeMetricMap(workouts, passDefinition.rules);
    const failTotals = computeMetricMap(workouts, failDefinition.rules);

    expect(passTotals.calories).toBe(200);
    expect(failTotals.calories).toBe(200);

    expect(getEarnedBadgesForUser(passTotals, [passDefinition])).toHaveLength(1);
    expect(getEarnedBadgesForUser(failTotals, [failDefinition])).toHaveLength(0);
  });

  it('session scope with avg aggregation passes when the average across sessions meets the target', () => {
    // "Steady Pacer" — average session duration must be at least 37.5 minutes.
    // Session 1 lasts 45 min, session 2 lasts 30 min, average is 37.5 min — passes at ≥ 37.5.
    // A stricter target of 40 min fails because the average is only 37.5.
    const workouts = [
      {
        workoutId: 1,
        startTime: '2026-04-01T08:00:00.000Z',
        endTime: '2026-04-01T08:45:00.000Z', // 45 min
        totalDistanceKm: 5,
        avgSpeedKmh: 8,
        totalCalories: 300,
        totalElevationGain: 100,
        xpEarned: 200,
      },
      {
        workoutId: 2,
        startTime: '2026-04-10T09:00:00.000Z',
        endTime: '2026-04-10T09:30:00.000Z', // 30 min
        totalDistanceKm: 3,
        avgSpeedKmh: 10,
        totalCalories: 200,
        totalElevationGain: 50,
        xpEarned: 150,
      },
    ];

    const passDefinition: AchievementDefinition = {
      code: 'steady_pacer',
      name: 'Steady Pacer',
      description: 'Average session duration of at least 37.5 minutes.',
      active: true,
      rules: [
        {
          scope: 'session',
          metric: 'duration_min',
          aggregation: 'avg',
          comparison: 'gte',
          target_value: 37.5,
          target_min: null,
          target_max: null,
          window_days: null,
        },
      ],
    };

    const failDefinition: AchievementDefinition = {
      code: 'steady_pacer_strict',
      name: 'Steady Pacer (Strict)',
      description: 'Average session duration of at least 40 minutes.',
      active: true,
      rules: [
        {
          scope: 'session',
          metric: 'duration_min',
          aggregation: 'avg',
          comparison: 'gte',
          target_value: 40,
          target_min: null,
          target_max: null,
          window_days: null,
        },
      ],
    };

    const passTotals = computeMetricMap(workouts, passDefinition.rules);
    const failTotals = computeMetricMap(workouts, failDefinition.rules);

    expect(passTotals.duration_min).toBe(37.5);
    expect(failTotals.duration_min).toBe(37.5);

    expect(getEarnedBadgesForUser(passTotals, [passDefinition])).toHaveLength(1);
    expect(getEarnedBadgesForUser(failTotals, [failDefinition])).toHaveLength(0);
  });
});

describe('applyAggregation', () => {
  it('returns zero for an empty values array', () => {
    expect(applyAggregation([], 'sum')).toBe(0);
    expect(applyAggregation([], 'count')).toBe(0);
    expect(applyAggregation([], 'max')).toBe(0);
    expect(applyAggregation([], 'min')).toBe(0);
    expect(applyAggregation([], 'avg')).toBe(0);
  });

  it('sums all values', () => {
    expect(applyAggregation([1, 2, 3], 'sum')).toBe(6);
  });

  it('counts the number of values', () => {
    expect(applyAggregation([10, 20, 30], 'count')).toBe(3);
  });

  it('returns the maximum value', () => {
    expect(applyAggregation([3, 9, 5], 'max')).toBe(9);
  });

  it('returns the minimum value', () => {
    expect(applyAggregation([3, 9, 5], 'min')).toBe(3);
  });

  it('returns the average value', () => {
    expect(applyAggregation([10, 20, 30], 'avg')).toBe(20);
  });
});

describe('computeMetricMap', () => {
  const workouts = [
    {
      workoutId: 1,
      startTime: '2026-04-01T08:00:00.000Z',
      endTime: '2026-04-01T08:45:00.000Z',
      totalDistanceKm: 5,
      avgSpeedKmh: 8,
      totalCalories: 300,
      totalElevationGain: 100,
      xpEarned: 200,
    },
    {
      workoutId: 2,
      startTime: '2026-04-10T09:00:00.000Z',
      endTime: '2026-04-10T09:30:00.000Z',
      totalDistanceKm: 3,
      avgSpeedKmh: 10,
      totalCalories: 200,
      totalElevationGain: 50,
      xpEarned: 150,
    },
  ];

  it('sums distance_km across lifetime sessions', () => {
    const map = computeMetricMap(workouts, [
      {
        scope: 'lifetime',
        metric: 'distance_km',
        aggregation: 'sum',
        comparison: 'gte',
        target_value: 1,
        target_min: null,
        target_max: null,
        window_days: null,
      },
    ]);

    expect(map['distance_km']).toBe(8);
  });

  it('returns the max speed across sessions', () => {
    const map = computeMetricMap(workouts, [
      {
        scope: 'lifetime',
        metric: 'speed',
        aggregation: 'max',
        comparison: 'gte',
        target_value: 1,
        target_min: null,
        target_max: null,
        window_days: null,
      },
    ]);

    expect(map['speed']).toBe(10);
  });

  it('counts sessions via sessions_count', () => {
    const map = computeMetricMap(workouts, [
      {
        scope: 'lifetime',
        metric: 'sessions_count',
        aggregation: 'count',
        comparison: 'gte',
        target_value: 1,
        target_min: null,
        target_max: null,
        window_days: null,
      },
    ]);

    expect(map['sessions_count']).toBe(2);
  });

  it('filters to rolling_window sessions by window_days', () => {
    // Only the second workout (April 10) is within 25 days of April 29 2026
    // The first workout (April 1) is 28 days ago and should be excluded
    const recentDate = new Date('2026-04-29T00:00:00.000Z');
    const originalDateNow = Date.now;
    Date.now = () => recentDate.getTime();

    try {
      const map = computeMetricMap(workouts, [
        {
          scope: 'rolling_window',
          metric: 'distance_km',
          aggregation: 'sum',
          comparison: 'gte',
          target_value: 1,
          target_min: null,
          target_max: null,
          window_days: 25,
        },
      ]);

      expect(map['distance_km']).toBe(3);
    } finally {
      Date.now = originalDateNow;
    }
  });
});
