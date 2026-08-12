import { sqliteTable, text, integer, real, index, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from '../users';

// Main workout table
export const workouts = sqliteTable(
  'workouts',
  {
    workoutId: integer('workout_id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startTime: text('start_time')
      .notNull()
      .default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    endTime: text('end_time'),
    totalDistanceKm: real('total_distance_km').notNull().default(0.0),
    avgSpeedKmh: real('avg_speed_kmh').notNull().default(0.0),
    totalCalories: integer('total_calories').notNull().default(0),
    totalElevationGain: real('total_elevation_gain').notNull().default(0.0),
    xpEarned: integer('xp_earned').notNull().default(0),
  },
  (table) => [
    index('idx_workouts_user_id').on(table.userId),
    check('workouts_total_distance_km_nonnegative', sql`${table.totalDistanceKm} >= 0`),
    check('workouts_avg_speed_kmh_nonnegative', sql`${table.avgSpeedKmh} >= 0`),
    check('workouts_total_calories_nonnegative', sql`${table.totalCalories} >= 0`),
    check('workouts_total_elevation_gain_nonnegative', sql`${table.totalElevationGain} >= 0`),
    check(
      'workouts_end_time_after_start_time',
      sql`${table.endTime} is null or ${table.endTime} >= ${table.startTime}`
    ),
    check('workouts_xp_earned_nonnegative', sql`${table.xpEarned} >= 0`),
  ]
);
