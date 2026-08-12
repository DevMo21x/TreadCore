// These are the supported metric keys and they match the metric names stored in the database
export type CoreBadgeMetric =
  | 'distance_km'
  | 'duration_min'
  | 'calories'
  | 'speed'
  | 'elevation_m'
  | 'xp'
  | 'sessions_count'
  | 'local_end_hour';

// This also allows custom metric names so new ideas can be added without changing this type
export type BadgeMetric = CoreBadgeMetric | (string & {});

// How to compute a metric value from a set of raw session values
export type AggregationFn = 'sum' | 'count' | 'max' | 'min' | 'avg';

// How to compare a computed metric value against a target
export type ComparisonOp = 'gte' | 'gt' | 'eq' | 'lte' | 'lt' | 'between';

// Reused metric map for lifetime totals, session totals or rolling window totals
export type WorkoutMetricMap = Record<string, number>;

// Mirrors the "achievement_rules" table fields so code and stored rules stay aligned
export type AchievementRule = {
  scope: 'session' | 'lifetime' | 'rolling_window';
  metric: CoreBadgeMetric;
  aggregation: AggregationFn;
  comparison: ComparisonOp;
  target_value: number;
  target_min: number | null;
  target_max: number | null;
  window_days: number | null;
};

// One achievement can include multiple rules and can be switched on or off
export type AchievementDefinition = {
  code: string;
  name: string;
  description: string;
  rules: AchievementRule[];
  active: boolean;
};

// An earned achievement includes the definition plus the value that made it pass
export type EarnedBadge = AchievementDefinition & {
  achievedValue: number;
};

// Represents a single earned achievement for use in API response typing
export type EarnedAchievement = EarnedBadge;
