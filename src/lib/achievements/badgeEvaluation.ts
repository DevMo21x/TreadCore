import type { WorkoutSummary } from '@/types';
import type {
  CoreBadgeMetric,
  BadgeMetric,
  AggregationFn,
  ComparisonOp,
  WorkoutMetricMap,
  AchievementRule,
  AchievementDefinition,
  EarnedBadge,
} from './types';

// Maps each CoreBadgeMetric to a function that extracts its per-session numeric value from a "WorkoutSummary"
// Derived fields: "duration_min" from start/end timestamps, "sessions_count" always 1 per session row,
// "local_end_hour" from the hour component of "endTime".
const WORKOUT_METRIC_EXTRACTORS: Record<CoreBadgeMetric, (w: WorkoutSummary) => number> = {
  distance_km: (w) => w.totalDistanceKm,
  calories: (w) => w.totalCalories,
  speed: (w) => w.avgSpeedKmh,
  elevation_m: (w) => w.totalElevationGain,
  xp: (w) => w.xpEarned,
  sessions_count: () => 1,
  duration_min: (w) => {
    if (!w.endTime) return 0;
    const durationMs = new Date(w.endTime).getTime() - new Date(w.startTime).getTime();
    return durationMs / 60_000;
  },
  local_end_hour: (w) => {
    if (!w.endTime) return 0;
    return new Date(w.endTime).getHours();
  },
};

// Apply an aggregation function to an array of per-session numeric values
export function applyAggregation(values: number[], aggregation: AggregationFn): number {
  if (values.length === 0) return 0;

  switch (aggregation) {
    case 'sum':
      return values.reduce((total, v) => total + v, 0);
    case 'count':
      return values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'avg':
      return values.reduce((total, v) => total + v, 0) / values.length;
  }
}

// Build a "WorkoutMetricMap" from raw workout sessions using the aggregation rules.
// Each rule describes how to derive its metric value from the session list and
// for "rolling_window" scope, only sessions within the last "window_days" days are used
export function computeMetricMap(
  workouts: WorkoutSummary[],
  rules: AchievementRule[]
): WorkoutMetricMap {
  const map: WorkoutMetricMap = {};

  for (const rule of rules) {
    let scopedWorkouts = workouts;

    if (rule.scope === 'rolling_window' && typeof rule.window_days === 'number') {
      const cutoff = Date.now() - rule.window_days * 24 * 60 * 60 * 1000;
      scopedWorkouts = workouts.filter((w) => {
        const endMs = w.endTime ? new Date(w.endTime).getTime() : new Date(w.startTime).getTime();
        return endMs >= cutoff;
      });
    } else if (rule.scope === 'session') {
      // For "session" scope, compute the metric value for each individual session and
      // then apply the aggregation across those per-session values
      const extractor = WORKOUT_METRIC_EXTRACTORS[rule.metric];
      const sessionValues = workouts.map(extractor);
      map[rule.metric] = applyAggregation(sessionValues, rule.aggregation);
      continue;
    }

    const extractor = WORKOUT_METRIC_EXTRACTORS[rule.metric];
    const values = scopedWorkouts.map(extractor);
    map[rule.metric] = applyAggregation(values, rule.aggregation);
  }

  return map;
}

function getMetricValue(totals: WorkoutMetricMap, metric: BadgeMetric): number {
  // Read the metric value requested by the rule
  const metricValue = totals[metric];

  // Treat missing or invalid values as zero to keep evaluation safe
  if (typeof metricValue !== 'number' || !Number.isFinite(metricValue)) {
    return 0;
  }

  return metricValue;
}

function isAchievementRuleSatisfied(totals: WorkoutMetricMap, rule: AchievementRule): boolean {
  const metricValue = getMetricValue(totals, rule.metric);

  // Compare the metric value using the rule comparison operator
  switch (rule.comparison) {
    case 'gte':
      return metricValue >= rule.target_value;
    case 'gt':
      return metricValue > rule.target_value;
    case 'eq':
      return metricValue === rule.target_value;
    case 'lte':
      return metricValue <= rule.target_value;
    case 'lt':
      return metricValue < rule.target_value;
    case 'between': {
      // A range check is valid only when both minimum and maximum values exist
      const hasMinimum = typeof rule.target_min === 'number' && Number.isFinite(rule.target_min);
      const hasMaximum = typeof rule.target_max === 'number' && Number.isFinite(rule.target_max);

      if (!hasMinimum || !hasMaximum) {
        return false;
      }

      return metricValue >= rule.target_min! && metricValue <= rule.target_max!;
    }
  }
}

function getPrimaryRuleAchievedValue(
  totals: WorkoutMetricMap,
  rules: ReadonlyArray<AchievementRule>
): number {
  // Use the first rule metric as the representative achieved value
  const primaryRule = rules[0];

  if (!primaryRule) {
    return 0;
  }

  return getMetricValue(totals, primaryRule.metric);
}

// Low-level: evaluate achievement definitions against a pre-computed metric map.
// Use this when the metric map has already been prepared upstream
export function getEarnedBadgesForUser(
  totals: WorkoutMetricMap,
  badgeDefinitions: ReadonlyArray<AchievementDefinition>
): EarnedBadge[] {
  // Step 1: Keep achievements where active is true and every rule passes.
  // Step 2: Add the achieved value for the first rule metric.
  return badgeDefinitions
    .filter(
      (badgeDefinition) =>
        badgeDefinition.active &&
        badgeDefinition.rules.length > 0 &&
        badgeDefinition.rules.every((rule) => isAchievementRuleSatisfied(totals, rule))
    )
    .map((badgeDefinition) => ({
      ...badgeDefinition,
      achievedValue: getPrimaryRuleAchievedValue(totals, badgeDefinition.rules),
    }));
}
