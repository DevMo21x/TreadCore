// =============================================================================
// SEED – starter badge definitions and their rules → SQLite
// =============================================================================
// Run this script once to populate the "achievement_definitions" and
// "achievement_rules" tables with a small set of beginner-friendly badges.
// These badges give new users quick wins early on to keep them motivated.
//
// Usage:  npx tsx src/db/seed-achievements.ts
// =============================================================================

import db from '../index';
import { achievement_definitions, achievement_rules } from '../schema/achievements';

// Each badge definition paired with its evaluation rules
const badges = [
  // ─── Distance Badges ────────────────────────────────────────────────────────
  {
    definition: {
      code: 'first_100_metres',
      name: 'First 100 Metres',
      description:
        'Walk or run at least 100 metres in a single session. Every journey begins with a first step!',
      image_url: '/badges/first-100-metres.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'distance_km' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 0.1, // 100 metres expressed in kilometres
      },
    ],
  },
  {
    definition: {
      code: 'half_kilometre',
      name: 'Half Kilometre',
      description: 'Cover at least 500 metres in a single session. You are building real momentum!',
      image_url: '/badges/half-kilometre.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'distance_km' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 0.5, // 500 metres expressed in kilometres
      },
    ],
  },
  {
    definition: {
      code: 'one_kilometre',
      name: 'One Kilometre',
      description: 'Complete at least 1 kilometre in a single session. A solid milestone!',
      image_url: '/badges/one-kilometre.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'distance_km' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 1.0,
      },
    ],
  },
  {
    definition: {
      code: 'five_kilometres',
      name: 'Five Kilometres',
      description: 'Run a full 5 kilometres in a single session. That is a proper workout!',
      image_url: '/badges/five-kilometres.svg',
      category: 'distance',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'distance_km' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 5.0,
      },
    ],
  },

  // ─── Duration Badges ────────────────────────────────────────────────────────
  {
    definition: {
      code: 'two_minutes',
      name: 'Two Minutes',
      description:
        'Stay on the treadmill for at least 2 minutes in a single session. A great warm-up!',
      image_url: '/badges/two-minutes.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'duration_min' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 2.0, // 2 minutes
      },
    ],
  },
  {
    definition: {
      code: 'five_minutes',
      name: 'Five Minutes',
      description: 'Keep going for at least 5 minutes in a single session. Consistency is key!',
      image_url: '/badges/five-minutes.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'duration_min' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 5.0, // 5 minutes
      },
    ],
  },
  {
    definition: {
      code: 'fifteen_minutes',
      name: 'Fifteen Minutes',
      description: 'Complete a 15-minute session on the treadmill. You are getting into the zone!',
      image_url: '/badges/fifteen-minutes.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'duration_min' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 15.0, // 15 minutes
      },
    ],
  },
  {
    definition: {
      code: 'thirty_minutes',
      name: 'Thirty Minutes',
      description: 'Push through a full 30-minute session. That is some serious dedication!',
      image_url: '/badges/thirty-minutes.svg',
      category: 'duration',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'duration_min' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 30.0, // 30 minutes
      },
    ],
  },

  // ─── Calorie Badges ─────────────────────────────────────────────────────────
  {
    definition: {
      code: 'fifty_calories',
      name: 'Fifty Calories',
      description: 'Burn at least 50 calories in a single session. Every calorie counts!',
      image_url: '/badges/fifty-calories.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'calories' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 50.0,
      },
    ],
  },
  {
    definition: {
      code: 'two_hundred_calories',
      name: 'Two Hundred Calories',
      description: 'Burn at least 200 calories in a single session. You are on fire!',
      image_url: '/badges/two-hundred-calories.svg',
      category: 'calories',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'calories' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 200.0,
      },
    ],
  },

  // ─── Session Count Badges ───────────────────────────────────────────────────
  {
    definition: {
      code: 'first_workout',
      name: 'First Workout',
      description: 'Complete your very first workout session. Welcome aboard!',
      image_url: '/badges/first-workout.svg',
      category: 'consistency',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'sessions_count' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 1.0,
      },
    ],
  },
  {
    definition: {
      code: 'five_workouts',
      name: 'Five Workouts',
      description: 'Complete 5 workout sessions in total. You are forming a healthy habit!',
      image_url: '/badges/five-workouts.svg',
      category: 'consistency',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'sessions_count' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 5.0,
      },
    ],
  },
  {
    definition: {
      code: 'ten_workouts',
      name: 'Ten Workouts',
      description: 'Complete 10 workout sessions in total. Double digits — impressive!',
      image_url: '/badges/ten-workouts.svg',
      category: 'consistency',
      active: true,
    },
    rules: [
      {
        scope: 'lifetime' as const,
        metric: 'sessions_count' as const,
        aggregation: 'sum' as const,
        comparison: 'gte' as const,
        target_value: 10.0,
      },
    ],
  },

  // ─── Speed Badge ────────────────────────────────────────────────────────────
  {
    definition: {
      code: 'speed_demon',
      name: 'Speed Demon',
      description:
        'Reach an average speed of at least 10 kilometres per hour in a single session. You are flying!',
      image_url: '/badges/speed-demon.svg',
      category: 'speed',
      active: true,
    },
    rules: [
      {
        scope: 'session' as const,
        metric: 'speed' as const,
        aggregation: 'max' as const,
        comparison: 'gte' as const,
        target_value: 10.0, // 10 kilometres per hour
      },
    ],
  },
];

// ─── Main Seeding Logic ─────────────────────────────────────────────────────
async function seedAchievements() {
  console.log('Seeding achievement badges...\n');

  for (const badge of badges) {
    // Insert the badge definition and retrieve the auto-generated identifier
    const [inserted] = db
      .insert(achievement_definitions)
      .values(badge.definition)
      .returning({ id: achievement_definitions.id })
      .all();

    // Insert each rule linked to the newly created badge definition
    for (const rule of badge.rules) {
      db.insert(achievement_rules)
        .values({
          achievement_id: inserted.id,
          scope: rule.scope,
          metric: rule.metric,
          aggregation: rule.aggregation,
          comparison: rule.comparison,
          target_value: rule.target_value,
          target_min: null,
          target_max: null,
          window_days: null,
        })
        .run();
    }

    console.log(`  ✓ ${badge.definition.name} (${badge.definition.code})`);
  }

  console.log(`\nDone — ${badges.length} badges seeded successfully.`);
}

seedAchievements().catch((error) => {
  console.error('Failed to seed achievements:', error);
  process.exit(1);
});
