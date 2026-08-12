// =============================================================================
// SEED – award sample badges to the test user → SQLite
// =============================================================================
// Run this script after "seed-achievements.ts" to give the test user a handful
// of earned badges so the user interface has data to display during development.
//
// Usage:  npx tsx src/db/seed-user-achievements.ts
// =============================================================================

import db from '../index';
import { user_achievements, achievement_definitions } from '../schema/achievements';
import { eq } from 'drizzle-orm';

// The test user who will receive the sample badges
const TEST_USER_ID = 1;

// Badge codes to award to the test user (a realistic beginner progression)
const badgeCodesToAward = [
  'first_workout',
  'five_workouts',
  'first_100_metres',
  'half_kilometre',
  'one_kilometre',
  'two_minutes',
  'five_minutes',
  'fifteen_minutes',
  'fifty_calories',
];

function seedUserAchievements() {
  console.log(`Awarding sample badges to user ${TEST_USER_ID}...\n`);

  // Fetch all achievement definitions from the database so we can look up their identifiers by code
  const allDefinitions = db
    .select({
      id: achievement_definitions.id,
      code: achievement_definitions.code,
      name: achievement_definitions.name,
    })
    .from(achievement_definitions)
    .all();

  let awardedCount = 0;

  for (const code of badgeCodesToAward) {
    const definition = allDefinitions.find((row) => row.code === code);

    if (!definition) {
      console.warn(`  ⚠ Badge with code "${code}" not found in the database — skipping.`);
      continue;
    }

    // Insert the earned badge record (uses "onConflictDoNothing" to avoid duplicates if re-run)
    db.insert(user_achievements)
      .values({
        user_id: TEST_USER_ID,
        achievement_id: definition.id,
        source_workout_id: null,
        metadata_json: null,
      })
      .onConflictDoNothing()
      .run();

    awardedCount++;
    console.log(`  ✓ ${definition.name} (${code})`);
  }

  console.log(`\nDone — ${awardedCount} badges awarded to user ${TEST_USER_ID}.`);
}

seedUserAchievements();
