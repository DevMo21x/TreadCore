import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const videoCategories = sqliteTable('video_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  thumbnailPath: text('thumbnail_path').notNull().default(''),
});

export const videos = sqliteTable(
  'videos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filename: text('filename').notNull(),
    title: text('title').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => videoCategories.id, { onDelete: 'restrict' }),
    thumbnailPath: text('thumbnail_path').notNull().default(''),
    videoPath: text('video_path').notNull(),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(date('now'))`),
  },
  (table) => [index('idx_videos_category_id').on(table.categoryId)]
);
