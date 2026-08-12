import { db } from '@/db';
import {
  achievement_definitions,
  achievement_rules,
  user_achievement_progress,
  user_achievements,
} from '@/db/schema';
import type { AchievementDefinition, AchievementRule } from '@/lib/achievements/types';
import { eq, inArray, sql } from 'drizzle-orm';

// Extends "AchievementDefinition" with the database row ID.
// The domain type does not carry an ID but the query layer needs it
// so callers can match against "getUserEarnedAchievementIds" and call "awardAchievement"
export type StoredAchievementDefinition = AchievementDefinition & {
  id: number;
  image_url: string;
};

// This shape is used when we return achievements already earned by a user.
// It includes both definition details and the date the achievement was earned
export type UserAchievementRecord = {
  id: number;
  code: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  active: boolean;
  earned_at: Date | null;
  source_workout_id: number | null;
};

// Returns all active achievement definitions with their rules.
// We do this in two queries:
// 1) Load active definitions.
// 2) Load rules for those definition IDs and then group rules in memory.
// This keeps the query logic simple and produces exactly the shape expected by badge evaluation
export async function getActiveAchievementDefinitions(): Promise<StoredAchievementDefinition[]> {
  const activeDefinitions = await db
    .select({
      id: achievement_definitions.id,
      code: achievement_definitions.code,
      name: achievement_definitions.name,
      description: achievement_definitions.description,
      image_url: achievement_definitions.image_url,
      active: achievement_definitions.active,
    })
    .from(achievement_definitions)
    .where(eq(achievement_definitions.active, true));

  if (activeDefinitions.length === 0) {
    return [];
  }

  const achievementDefinitionIds = activeDefinitions.map((definition) => definition.id);

  // Pull every rule that belongs to the active definitions
  const ruleRows = await db
    .select({
      achievement_id: achievement_rules.achievement_id,
      scope: achievement_rules.scope,
      metric: achievement_rules.metric,
      aggregation: achievement_rules.aggregation,
      comparison: achievement_rules.comparison,
      target_value: achievement_rules.target_value,
      target_min: achievement_rules.target_min,
      target_max: achievement_rules.target_max,
      window_days: achievement_rules.window_days,
    })
    .from(achievement_rules)
    .where(inArray(achievement_rules.achievement_id, achievementDefinitionIds));

  // Group rules by achievement ID so each definition gets its own rules array
  const rulesByAchievementId = new Map<number, AchievementRule[]>();

  for (const ruleRow of ruleRows) {
    const existingRules = rulesByAchievementId.get(ruleRow.achievement_id) ?? [];

    existingRules.push({
      scope: ruleRow.scope,
      metric: ruleRow.metric,
      aggregation: ruleRow.aggregation,
      comparison: ruleRow.comparison,
      target_value: ruleRow.target_value,
      target_min: ruleRow.target_min,
      target_max: ruleRow.target_max,
      window_days: ruleRow.window_days,
    });

    rulesByAchievementId.set(ruleRow.achievement_id, existingRules);
  }

  return activeDefinitions.map((definition) => ({
    id: definition.id,
    code: definition.code,
    name: definition.name,
    description: definition.description,
    image_url: definition.image_url,
    active: definition.active,
    rules: rulesByAchievementId.get(definition.id) ?? [],
  }));
}

// Returns only the achievement IDs already earned by a user.
// A "Set" is used for fast lookups when checking "already earned or not"
export async function getUserEarnedAchievementIds(userId: number): Promise<Set<number>> {
  const rows = await db
    .select({
      achievement_id: user_achievements.achievement_id,
    })
    .from(user_achievements)
    .where(eq(user_achievements.user_id, userId));

  return new Set(rows.map((row) => row.achievement_id));
}

// Awards an achievement to a user.
// If the same user already has the same achievement then the insert is ignored.
// This behaviour is intentional so calling this twice is safe
export async function awardAchievement(
  userId: number,
  achievementId: number,
  workoutId?: number
): Promise<void> {
  await db
    .insert(user_achievements)
    .values({
      user_id: userId,
      achievement_id: achievementId,
      source_workout_id: workoutId ?? null,
    })
    .onConflictDoNothing();
}

// Creates or updates progress for one user and one achievement.
// If the row exists then "progress_value" and "updated_at" are updated in place.
// If the row does not exist then a new row is inserted
export async function upsertAchievementProgress(
  userId: number,
  achievementId: number,
  value: number
): Promise<void> {
  await db
    .insert(user_achievement_progress)
    .values({
      user_id: userId,
      achievement_id: achievementId,
      progress_value: value,
      updated_at: sql`(unixepoch())`,
    })
    .onConflictDoUpdate({
      target: [user_achievement_progress.achievement_id, user_achievement_progress.user_id],
      set: {
        progress_value: value,
        updated_at: sql`(unixepoch())`,
      },
    });
}

// Returns achievements earned by a user with definition details.
// This uses an inner join so only achievements that were actually earned are returned
export async function getUserAchievements(userId: number): Promise<UserAchievementRecord[]> {
  return db
    .select({
      id: achievement_definitions.id,
      code: achievement_definitions.code,
      name: achievement_definitions.name,
      description: achievement_definitions.description,
      image_url: achievement_definitions.image_url,
      category: achievement_definitions.category,
      active: achievement_definitions.active,
      earned_at: user_achievements.earned_at,
      source_workout_id: user_achievements.source_workout_id,
    })
    .from(user_achievements)
    .innerJoin(
      achievement_definitions,
      eq(user_achievements.achievement_id, achievement_definitions.id)
    )
    .where(eq(user_achievements.user_id, userId));
}
