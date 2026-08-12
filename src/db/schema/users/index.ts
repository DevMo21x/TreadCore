import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { themeModeValues } from '@/lib/users/themeMode';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey(),
    username: text('username').notNull(),
    password: text('password').notNull(),
    role: text('role', { enum: ['user', 'guest', 'admin'] })
      .notNull()
      .default('user'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    weightKg: real('weight_kg'),
    ageYears: integer('age_years'),
    themeMode: text('theme_mode', { enum: themeModeValues }).notNull().default('dark'),
  },
  (table) => [uniqueIndex('users_username_unique').on(table.username)]
);
