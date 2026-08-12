'use server';

import { db } from '@/db';
import { workouts } from '@/db/schema/workouts';
import { users } from '@/db/schema/users';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { and, desc, eq, ne, sql } from 'drizzle-orm';

export type LeaderboardSort = 'xp' | 'distance' | 'calories' | 'elevation' | 'duration';

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalDistanceKm: number;
  totalCalories: number;
  totalXp: number;
  totalElevationGain: number;
  totalDurationSeconds: number;
  workoutCount: number;
  rank: number;
}

const SORT_EXPRESSIONS: Record<LeaderboardSort, ReturnType<typeof sql>> = {
  xp: sql`sum(${workouts.xpEarned})`,
  distance: sql`sum(${workouts.totalDistanceKm})`,
  calories: sql`sum(${workouts.totalCalories})`,
  elevation: sql`sum(${workouts.totalElevationGain})`,
  duration: sql`sum(strftime('%s', ${workouts.endTime}) - strftime('%s', ${workouts.startTime}))`,
};

/**
 * Returns all users ranked by the given statistic across all completed workouts.
 * Defaults to ranking by total XP. Only completed workouts (non-null endTime) are counted.
 */
export async function getLeaderboard(sortBy: LeaderboardSort = 'xp'): Promise<LeaderboardEntry[]> {
  const orderExpr = SORT_EXPRESSIONS[sortBy];

  const rows = await db
    .select({
      userId: workouts.userId,
      username: users.username,
      totalDistanceKm: sql<number>`sum(${workouts.totalDistanceKm})`,
      totalCalories: sql<number>`sum(${workouts.totalCalories})`,
      totalXp: sql<number>`sum(${workouts.xpEarned})`,
      totalElevationGain: sql<number>`sum(${workouts.totalElevationGain})`,
      totalDurationSeconds: sql<number>`sum(strftime('%s', ${workouts.endTime}) - strftime('%s', ${workouts.startTime}))`,
      workoutCount: sql<number>`count(${workouts.workoutId})`,
    })
    .from(workouts)
    .innerJoin(users, eq(workouts.userId, users.id))
    .where(and(sql`${workouts.endTime} is not null`, ne(users.role, ADMIN_ROLE)))
    .groupBy(workouts.userId)
    .orderBy(desc(orderExpr));

  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
  }));
}

export interface UserLifetimeStats {
  totalDistanceKm: number;
  totalCalories: number;
  totalXp: number;
  workoutCount: number;
}

/**
 * Returns the lifetime workout statistics for a single user by summing
 * all of their completed workouts. Returns null if the user has no completed workouts.
 */
export async function getUserLifetimeStats(userId: number): Promise<UserLifetimeStats | null> {
  const [row] = await db
    .select({
      totalDistanceKm: sql<number>`sum(${workouts.totalDistanceKm})`,
      totalCalories: sql<number>`sum(${workouts.totalCalories})`,
      totalXp: sql<number>`sum(${workouts.xpEarned})`,
      workoutCount: sql<number>`count(${workouts.workoutId})`,
    })
    .from(workouts)
    .where(sql`${workouts.userId} = ${userId} and ${workouts.endTime} is not null`);

  if (!row || row.workoutCount === 0) return null;

  return row;
}
