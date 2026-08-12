import { primaryKey, sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from '../users';

// Achievement system tables
// Parent table for achievements defining the achievement types and their properties
export const achievement_definitions = sqliteTable('achievement_definitions', {
  id: integer('id').primaryKey({ autoIncrement: true }), // For internal joins and fastest indexing
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image_url: text('image_url').notNull(),
  category: text('category').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true).notNull(),
});

// Child table for achievement rules defining the specific criteria for each achievement i.e the logic
export const achievement_rules = sqliteTable(
  'achievement_rules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }), // For internal joins and fastest indexing
    achievement_id: integer('achievement_id')
      .notNull()
      .references(() => achievement_definitions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    scope: text('scope', { enum: ['session', 'lifetime', 'rolling_window'] }).notNull(),
    metric: text('metric', {
      enum: [
        'distance_km',
        'duration_min',
        'calories',
        'speed',
        'elevation_m',
        'xp',
        'sessions_count',
        'local_end_hour',
      ],
    }).notNull(),
    aggregation: text('aggregation', {
      enum: ['sum', 'count', 'max', 'min', 'avg'],
    }).notNull(),
    comparison: text('comparison', {
      enum: ['gte', 'gt', 'eq', 'lte', 'lt', 'between'],
    }).notNull(),
    target_value: real('target_value').notNull(),
    target_min: real('target_min'),
    target_max: real('target_max'),
    window_days: integer('window_days'), // Only applicable for rolling_window scope
  },
  (table) => [
    unique('achievement_rules_achievement_id_metric_unique').on(table.achievement_id, table.metric), // Each metric can only appear once per achievement
  ]
);

// Child table for tracking badges earned by the user
export const user_achievements = sqliteTable(
  'user_achievements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }), // For internal joins and fastest indexing
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    achievement_id: integer('achievement_id')
      .notNull()
      .references(() => achievement_definitions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    earned_at: integer('earned_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    source_workout_id: integer('source_workout_id'), // Optional reference to the workout that triggered the achievement, if applicable
    metadata_json: text('metadata_json'), // JSON string to manage extra content that does not fit neatly into fixed columns so that database redesining is avoided
  },
  (table) => [
    unique('user_achievements_achievement_id_user_id_unique').on(
      table.achievement_id,
      table.user_id
    ), // To ensure that a user can earn a specific achievement only once
  ]
);

// Optional table to track a user's progress
export const user_achievement_progress = sqliteTable(
  'user_achievement_progress',
  {
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    achievement_id: integer('achievement_id')
      .notNull()
      .references(() => achievement_definitions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    progress_value: real('progress_value').notNull(),
    updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql` (unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.achievement_id, table.user_id] }), // Composite primary key to ensure one progress record per user per achievement
  ]
);
