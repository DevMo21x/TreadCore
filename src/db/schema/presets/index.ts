import { sqliteTable, text, integer, real, index, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from '../users';

export const presets = sqliteTable(
  'presets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    authorId: integer('author_id').references(() => users.id),
    visibility: text('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('public'),
    tags: text('tags'),
    difficulty: text('difficulty', { enum: ['easy', 'moderate', 'hard'] })
      .notNull()
      .default('moderate'),
    totalDurationSeconds: integer('total_duration_seconds'),
    createdAt: text('created_at').default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updatedAt: text('updated_at').default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
  },
  (table) => [
    index('idx_presets_author_id').on(table.authorId),
    index('idx_presets_visibility').on(table.visibility),
    index('idx_presets_visibility_created').on(table.visibility, table.createdAt),
    check(
      'presets_visibility_author_consistency',
      sql`(${table.visibility} = 'public' AND ${table.authorId} IS NULL) OR (${table.visibility} = 'private' AND ${table.authorId} IS NOT NULL)`
    ),
  ]
);

export const presetSegments = sqliteTable(
  'preset_segments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    presetId: integer('preset_id')
      .notNull()
      .references(() => presets.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    name: text('name'),
    durationSeconds: integer('duration_seconds').notNull(),
    speed: real('speed').notNull(),
    incline: real('incline').notNull(),
  },
  (table) => [index('idx_preset_segments_preset_id').on(table.presetId)]
);
