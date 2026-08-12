import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import db from './index';

export function runMigrations() {
  try {
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  } catch (err: unknown) {
    // If migrations were applied manually (e.g. via sqlite3) the migrator
    // may wrap the underlying SqliteError. Inspect both the top-level
    // error and its `cause` property for the SQLITE_ERROR + "already exists" message.
    const sqliteErr =
      (err !== null && typeof err === 'object' && 'cause' in err
        ? (err as { cause: unknown }).cause
        : null) ?? err;
    if (
      sqliteErr !== null &&
      typeof sqliteErr === 'object' &&
      'code' in sqliteErr &&
      (sqliteErr as { code: unknown }).code === 'SQLITE_ERROR' &&
      'message' in sqliteErr &&
      typeof (sqliteErr as { message: unknown }).message === 'string' &&
      /already exists/.test((sqliteErr as { message: string }).message)
    ) {
      console.warn('runMigrations: migration skipped because table already exists.');
      return;
    }
    throw err;
  }
}
