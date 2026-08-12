import { db } from '@/db';
import { workouts } from '@/db/schema';
import type { WorkoutMetricMap } from '@/lib/achievements/types';
import { eq, sql } from 'drizzle-orm';

// A safe default object so callers always get every metric key even when no rows are found
const EMPTY_WORKOUT_METRIC_MAP: WorkoutMetricMap = {
  distance_km: 0,
  duration_min: 0,
  calories: 0,
  speed: 0,
  elevation_m: 0,
  xp: 0,
  sessions_count: 0,
  local_end_hour: 0,
};

// Converts unknown numeric values into a safe number.
// If the value is null, undefined or invalid then we return zero
function toFiniteNumber(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

// Converts a timezone offset like "-4" into SQLite modifier text "-4 hours"
function createUtcOffsetModifier(utcOffsetHours: number): string {
  return `${utcOffsetHours} hours`;
}

// Maps one aggregated database row into the "WorkoutMetricMap" shape used by badge evaluation
function mapAggregateRowToMetricMap(
  row:
    | {
        distance_km: number;
        calories: number;
        elevation_m: number;
        xp: number;
        sessions_count: number;
        duration_min: number;
        local_end_hour: number;
      }
    | undefined
): WorkoutMetricMap {
  if (!row) {
    return { ...EMPTY_WORKOUT_METRIC_MAP };
  }

  return {
    ...EMPTY_WORKOUT_METRIC_MAP,
    distance_km: toFiniteNumber(row.distance_km),
    calories: toFiniteNumber(row.calories),
    elevation_m: toFiniteNumber(row.elevation_m),
    xp: toFiniteNumber(row.xp),
    sessions_count: toFiniteNumber(row.sessions_count),
    duration_min: toFiniteNumber(row.duration_min),
    local_end_hour: toFiniteNumber(row.local_end_hour),
  };
}

// Returns lifetime totals for all completed workouts of one user.
// "Completed" means "end_time" is not null.
// "local_end_hour" is calculated from the latest "end_time" in the selected rows,
// shifted by "utcOffsetHours"
export async function getUserLifetimeTotals(
  userId: number,
  utcOffsetHours: number = -4
): Promise<WorkoutMetricMap> {
  const utcOffsetModifier = createUtcOffsetModifier(utcOffsetHours);

  const [row] = await db
    .select({
      distance_km: sql<number>`coalesce(sum(${workouts.totalDistanceKm}), 0)`,
      calories: sql<number>`coalesce(sum(${workouts.totalCalories}), 0)`,
      elevation_m: sql<number>`coalesce(sum(${workouts.totalElevationGain}), 0)`,
      xp: sql<number>`coalesce(sum(${workouts.xpEarned}), 0)`,
      sessions_count: sql<number>`count(${workouts.workoutId})`,
      // Convert date difference into minutes.
      duration_min: sql<number>`coalesce(sum((julianday(${workouts.endTime}) - julianday(${workouts.startTime})) * 1440), 0)`,
      // Hour of the most recent local end time after timezone offset is applied
      local_end_hour: sql<number>`coalesce(cast(strftime('%H', max(${workouts.endTime}), ${utcOffsetModifier}) as integer), 0)`,
    })
    .from(workouts)
    .where(sql`${workouts.userId} = ${userId} and ${workouts.endTime} is not null`);

  return mapAggregateRowToMetricMap(row);
}

// Returns totals only for workouts that started within the last "windowDays" days.
// This follows the same metric calculations as lifetime totals
export async function getUserWorkoutsInWindow(
  userId: number,
  windowDays: number,
  utcOffsetHours: number = -4
): Promise<WorkoutMetricMap> {
  const utcOffsetModifier = createUtcOffsetModifier(utcOffsetHours);
  const windowModifier = `-${windowDays} days`;

  const [row] = await db
    .select({
      distance_km: sql<number>`coalesce(sum(${workouts.totalDistanceKm}), 0)`,
      calories: sql<number>`coalesce(sum(${workouts.totalCalories}), 0)`,
      elevation_m: sql<number>`coalesce(sum(${workouts.totalElevationGain}), 0)`,
      xp: sql<number>`coalesce(sum(${workouts.xpEarned}), 0)`,
      sessions_count: sql<number>`count(${workouts.workoutId})`,
      // Convert date difference into minutes
      duration_min: sql<number>`coalesce(sum((julianday(${workouts.endTime}) - julianday(${workouts.startTime})) * 1440), 0)`,
      // Hour of the most recent local end time after timezone offset is applied
      local_end_hour: sql<number>`coalesce(cast(strftime('%H', max(${workouts.endTime}), ${utcOffsetModifier}) as integer), 0)`,
    })
    .from(workouts)
    .where(
      sql`${workouts.userId} = ${userId} and ${workouts.endTime} is not null and ${workouts.startTime} >= datetime('now', ${windowModifier})`
    );

  return mapAggregateRowToMetricMap(row);
}

// Returns metrics for one specific workout ID.
// "sessions_count" is intentionally fixed to 1 because this function represents one session
export async function getWorkoutStats(
  workoutId: number,
  utcOffsetHours: number = -4
): Promise<WorkoutMetricMap> {
  const utcOffsetModifier = createUtcOffsetModifier(utcOffsetHours);

  const [row] = await db
    .select({
      distance_km: workouts.totalDistanceKm,
      calories: workouts.totalCalories,
      speed: workouts.avgSpeedKmh,
      elevation_m: workouts.totalElevationGain,
      xp: workouts.xpEarned,
      // Convert this workout duration into minutes
      duration_min: sql<number>`coalesce((julianday(${workouts.endTime}) - julianday(${workouts.startTime})) * 1440, 0)`,
      // Convert workout end time into local hour using "utcOffsetHours"
      local_end_hour: sql<number>`coalesce(cast(strftime('%H', ${workouts.endTime}, ${utcOffsetModifier}) as integer), 0)`,
    })
    .from(workouts)
    .where(eq(workouts.workoutId, workoutId))
    .limit(1);

  if (!row) {
    return { ...EMPTY_WORKOUT_METRIC_MAP };
  }

  return {
    ...EMPTY_WORKOUT_METRIC_MAP,
    distance_km: toFiniteNumber(row.distance_km),
    calories: toFiniteNumber(row.calories),
    speed: toFiniteNumber(row.speed),
    elevation_m: toFiniteNumber(row.elevation_m),
    xp: toFiniteNumber(row.xp),
    sessions_count: 1,
    duration_min: toFiniteNumber(row.duration_min),
    local_end_hour: toFiniteNumber(row.local_end_hour),
  };
}

// Represents one calendar day and the total distance (km) logged across all completed
// workouts on that day. "date" is formatted as "YYYY-MM-DD" in the user's local timezone
export type WorkoutDateDistance = {
  date: string;
  distanceKm: number;
};

// Optional filters for the workout date query.
// "startDate" and "endDate" use the local date format "YYYY-MM-DD".
// "year" is a convenience that builds a full calendar year range
export type WorkoutDateRange = {
  startDate?: string;
  endDate?: string;
  year?: number;
};

// Builds a date range object from the optional inputs.
// When "year" is provided it takes priority over explicit dates
function resolveWorkoutDateRange(range?: WorkoutDateRange): {
  startDate?: string;
  endDate?: string;
} {
  if (!range) {
    return {};
  }

  if (Number.isInteger(range.year)) {
    return {
      startDate: `${range.year}-01-01`,
      endDate: `${range.year}-12-31`,
    };
  }

  return {
    startDate: range.startDate,
    endDate: range.endDate,
  };
}

// Returns the total distance (km) logged per calendar day for one user.
// Days are expressed in the user's local timezone by applying "utcOffsetHours"
// to the stored Coordinated Universal Time (UTC) "start_time" value.
// Only completed workouts are included — rows where "end_time" is not null.
// The list is returned in ascending date order because the
// React Activity Calendar component requires dates in chronological order.
// Optional range filters reduce the amount of data sent to the client.
export async function getWorkoutDistanceByDate(
  userId: number,
  utcOffsetHours: number = -4,
  range?: WorkoutDateRange
): Promise<WorkoutDateDistance[]> {
  const utcOffsetModifier = createUtcOffsetModifier(utcOffsetHours);
  const { startDate, endDate } = resolveWorkoutDateRange(range);

  // Reused expression so the "select", "group by" and "order by" clauses
  // all refer to the exact same local date calculation
  const localDateExpression = sql<string>`date(${workouts.startTime}, ${utcOffsetModifier})`;

  const whereParts = [sql`${workouts.userId} = ${userId}`, sql`${workouts.endTime} is not null`];

  if (startDate) {
    whereParts.push(sql`${localDateExpression} >= ${startDate}`);
  }

  if (endDate) {
    whereParts.push(sql`${localDateExpression} <= ${endDate}`);
  }

  const rows = await db
    .select({
      date: localDateExpression,
      distanceKm: sql<number>`round(coalesce(sum(${workouts.totalDistanceKm}), 0), 2)`,
    })
    .from(workouts)
    .where(sql.join(whereParts, sql` and `))
    .groupBy(localDateExpression)
    .orderBy(sql`${localDateExpression} asc`);

  return rows;
}

// Returns the earliest local calendar date for a completed workout.
// If no completed workouts exist for the user then null is returned.
export async function getFirstWorkoutDate(
  userId: number,
  utcOffsetHours: number = -4
): Promise<string | null> {
  const utcOffsetModifier = createUtcOffsetModifier(utcOffsetHours);

  const [row] = await db
    .select({
      firstWorkoutDate: sql<string | null>`min(date(${workouts.startTime}, ${utcOffsetModifier}))`,
    })
    .from(workouts)
    .where(sql`${workouts.userId} = ${userId} and ${workouts.endTime} is not null`);

  return row?.firstWorkoutDate ?? null;
}
