import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as schema from '@/db/schema';
import { users } from '@/db/schema';
import { ADMIN_ROLE, GUEST_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';

const sqlite = new Database(':memory:');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.doMock('@/db/index', () => ({
  default: db,
}));

let getAllUsers: typeof import('@/lib/actions/user').getAllUsers;

beforeAll(async () => {
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  const userActionsModule = await import('@/lib/actions/user');
  getAllUsers = userActionsModule.getAllUsers;
});

beforeEach(async () => {
  sqlite.exec('delete from users;');
});

afterAll(() => {
  sqlite.close();
});

describe('getAllUsers', () => {
  it('returns only non-guest, non-admin usernames', async () => {
    await db.insert(users).values([
      { id: 1, username: 'alice', password: 'hashed-password', role: USER_ROLE },
      { id: 2, username: 'bob', password: 'hashed-password', role: USER_ROLE },
      { id: 3, username: 'guest-user', password: 'hashed-password', role: GUEST_ROLE },
      { id: 4, username: 'admin-user', password: 'hashed-password', role: ADMIN_ROLE },
    ]);

    const result = await getAllUsers();

    expect([...result].sort()).toEqual(['alice', 'bob']);
  });

  it('returns an empty array when only admin and guest accounts exist', async () => {
    await db.insert(users).values([
      { id: 1, username: 'guest-user', password: 'hashed-password', role: GUEST_ROLE },
      { id: 2, username: 'admin-user', password: 'hashed-password', role: ADMIN_ROLE },
    ]);

    await expect(getAllUsers()).resolves.toEqual([]);
  });
});
