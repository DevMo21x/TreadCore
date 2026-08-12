'use server';

import { db } from '@/db';
import { workouts } from '@/db/schema';
import { evaluateAchievementsAfterWorkout } from '@/lib/achievements';
import { getUserWeight } from '@/db/queries/users';
import { eq, desc } from 'drizzle-orm';
import type { WorkoutSummary } from '@/types';

type FinalizedWorkoutBadge = {
  name: string;
  description: string;
  imagePath: string | null;
};

/**
 * Fetches the current user's weight in kilograms
 * @param userId - The user's ID
 * @returns The user's weight in kg, or null if not set
 */
export async function fetchUserWeight(userId: number): Promise<number | null> {
  return getUserWeight(userId);
}

/**
 * Creates a new workout record in the database
 * @returns The identifier of the newly created workout
 */
export async function createWorkout(userId: number): Promise<number> {
  const [row] = await db
    .insert(workouts)
    .values({ userId })
    .returning({ workoutId: workouts.workoutId });
  return row.workoutId;
}

/**
 * Permanently deletes one workout record.
 *
 * The schema no longer stores persistent per-tick metric rows (see migration
 * 0011), so deleting the workout row removes all persisted traces for the
 * active schema.
 */
export async function deleteWorkout(workoutId: number): Promise<void> {
  await db.delete(workouts).where(eq(workouts.workoutId, workoutId));
}

/**
 * Finalizes a workout by setting "endTime" and saving summary statistics and
 * then evaluates whether the user has earned any new achievements.
 */
export async function finalizeWorkout(
  userId: number,
  workoutId: number,
  totalDistanceKm: number,
  avgSpeedKmh: number,
  totalCalories: number,
  xpEarned: number,
  totalElevationGain: number
): Promise<FinalizedWorkoutBadge[]> {
  const [updatedWorkout] = await db
    .update(workouts)
    .set({
      endTime: new Date().toISOString(),
      totalDistanceKm,
      avgSpeedKmh,
      totalCalories,
      xpEarned,
      totalElevationGain,
    })
    .where(eq(workouts.workoutId, workoutId))
    .returning({ workoutId: workouts.workoutId });

  // Stop when no workout row was updated for this identifier
  if (!updatedWorkout) {
    return [];
  }

  try {
    // Evaluate and award newly earned achievements after workout completion
    const earnedAchievements = await evaluateAchievementsAfterWorkout(userId, workoutId);

    return earnedAchievements.map((achievement) => ({
      name: achievement.name,
      description: achievement.description,
      imagePath: achievement.image_url ?? null,
    }));
  } catch (error) {
    // Saving a finished workout must not fail because achievement checking had a problem
    console.error('Failed to evaluate achievements after workout finalization', error);
    return [];
  }
}

/**
 * Returns all finished workouts for one user with newest first
 */
export async function getWorkoutHistory(userId: number): Promise<WorkoutSummary[]> {
  const rows = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startTime));

  return rows.map((r) => ({
    workoutId: r.workoutId,
    startTime: r.startTime,
    endTime: r.endTime ?? null,
    totalDistanceKm: r.totalDistanceKm,
    avgSpeedKmh: r.avgSpeedKmh,
    totalCalories: r.totalCalories,
    totalElevationGain: r.totalElevationGain,
    xpEarned: r.xpEarned,
  }));
}
