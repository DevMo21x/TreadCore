import 'server-only';

import {
  awardAchievement,
  getActiveAchievementDefinitions,
  getUserEarnedAchievementIds,
  type StoredAchievementDefinition,
} from '@/db/queries/achievements';
import {
  getUserLifetimeTotals,
  getUserWorkoutsInWindow,
  getWorkoutStats,
} from '@/db/queries/workouts';
import { getEarnedBadgesForUser } from './badgeEvaluation';
import type { AchievementRule, WorkoutMetricMap } from './types';

// Dependency bag allows direct function mocking in tests
type EvaluateAchievementsAfterWorkoutDependencies = {
  getActiveAchievementDefinitions: typeof getActiveAchievementDefinitions;
  getUserEarnedAchievementIds: typeof getUserEarnedAchievementIds;
  getUserLifetimeTotals: typeof getUserLifetimeTotals;
  getWorkoutStats: typeof getWorkoutStats;
  getUserWorkoutsInWindow: typeof getUserWorkoutsInWindow;
  awardAchievement: typeof awardAchievement;
};

// Default production dependencies use real query functions
const defaultEvaluateAchievementsAfterWorkoutDependencies: EvaluateAchievementsAfterWorkoutDependencies =
  {
    getActiveAchievementDefinitions,
    getUserEarnedAchievementIds,
    getUserLifetimeTotals,
    getWorkoutStats,
    getUserWorkoutsInWindow,
    awardAchievement,
  };

// Captures which data sets are needed for one evaluation run
type ScopeRequirement = {
  needsLifetimeTotals: boolean;
  needsSessionTotals: boolean;
  rollingWindowDays: number[];
};

// Scans rules once so only required data can be fetched
function collectScopeRequirement(
  achievementDefinitions: ReadonlyArray<StoredAchievementDefinition>
): ScopeRequirement {
  let needsLifetimeTotals = false;
  let needsSessionTotals = false;
  const rollingWindowDaySet = new Set<number>();

  for (const achievementDefinition of achievementDefinitions) {
    for (const rule of achievementDefinition.rules) {
      if (rule.scope === 'lifetime') {
        needsLifetimeTotals = true;
      }

      if (rule.scope === 'session') {
        needsSessionTotals = true;
      }

      if (rule.scope === 'rolling_window' && Number.isFinite(rule.window_days)) {
        rollingWindowDaySet.add(rule.window_days as number);
      }
    }
  }

  return {
    needsLifetimeTotals,
    needsSessionTotals,
    rollingWindowDays: [...rollingWindowDaySet],
  };
}

// Reads one metric safely and falls back to zero when the value is invalid
function readMetricValue(metricMap: WorkoutMetricMap | null | undefined, metric: string): number {
  const value = metricMap?.[metric];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

// Resolves one rule metric from the correct source map for that scope
function getRuleMetricValue(
  rule: AchievementRule,
  lifetimeTotals: WorkoutMetricMap | null,
  sessionTotals: WorkoutMetricMap | null,
  rollingWindowTotalsByDay: ReadonlyMap<number, WorkoutMetricMap>
): number {
  if (rule.scope === 'lifetime') {
    return readMetricValue(lifetimeTotals, rule.metric);
  }

  if (rule.scope === 'session') {
    return readMetricValue(sessionTotals, rule.metric);
  }

  if (rule.scope === 'rolling_window' && Number.isFinite(rule.window_days)) {
    const rollingWindowTotals = rollingWindowTotalsByDay.get(rule.window_days as number);
    return readMetricValue(rollingWindowTotals, rule.metric);
  }

  return 0;
}

// Evaluates all active achievements after one workout has been finalized and
// only the needed data sets are fetched from the database
export async function evaluateAchievementsAfterWorkout(
  userId: number,
  workoutId: number,
  utcOffsetHours: number = -4,
  dependencies: EvaluateAchievementsAfterWorkoutDependencies = defaultEvaluateAchievementsAfterWorkoutDependencies
): Promise<StoredAchievementDefinition[]> {
  const [activeAchievementDefinitions, earnedAchievementIds] = await Promise.all([
    dependencies.getActiveAchievementDefinitions(),
    dependencies.getUserEarnedAchievementIds(userId),
  ]);

  // Already earned achievements are removed before any extra data is loaded
  const unearnedDefinitions = activeAchievementDefinitions.filter(
    (achievementDefinition) =>
      achievementDefinition.rules.length > 0 && !earnedAchievementIds.has(achievementDefinition.id)
  );

  if (unearnedDefinitions.length === 0) {
    return [];
  }

  const scopeRequirement = collectScopeRequirement(unearnedDefinitions);

  const lifetimeTotalsPromise = scopeRequirement.needsLifetimeTotals
    ? dependencies.getUserLifetimeTotals(userId, utcOffsetHours)
    : Promise.resolve<WorkoutMetricMap | null>(null);

  const sessionTotalsPromise = scopeRequirement.needsSessionTotals
    ? dependencies.getWorkoutStats(workoutId, utcOffsetHours)
    : Promise.resolve<WorkoutMetricMap | null>(null);

  const rollingWindowPromises = scopeRequirement.rollingWindowDays.map((windowDays) =>
    dependencies.getUserWorkoutsInWindow(userId, windowDays, utcOffsetHours)
  );

  const [lifetimeTotals, sessionTotals, rollingWindowTotals] = await Promise.all([
    lifetimeTotalsPromise,
    sessionTotalsPromise,
    Promise.all(rollingWindowPromises),
  ]);

  const rollingWindowTotalsByDay = new Map<number, WorkoutMetricMap>();

  // Keeps each rolling window result mapped by day value for fast lookups
  scopeRequirement.rollingWindowDays.forEach((windowDays, index) => {
    rollingWindowTotalsByDay.set(windowDays, rollingWindowTotals[index]);
  });

  const newlyAwardedDefinitions = unearnedDefinitions.filter((achievementDefinition) => {
    const mergedMetricMap: WorkoutMetricMap = {};

    // Each achievement rule reads its value from the correct source map
    for (const rule of achievementDefinition.rules) {
      mergedMetricMap[rule.metric] = getRuleMetricValue(
        rule,
        lifetimeTotals,
        sessionTotals,
        rollingWindowTotalsByDay
      );
    }

    return getEarnedBadgesForUser(mergedMetricMap, [achievementDefinition]).length > 0;
  });

  // Award calls stay idempotent because the insert query already ignores duplicates
  await Promise.all(
    newlyAwardedDefinitions.map((achievementDefinition) =>
      dependencies.awardAchievement(userId, achievementDefinition.id, workoutId)
    )
  );

  // Progress tracking by insert or update is intentionally left for a separate decision
  return newlyAwardedDefinitions;
}
