import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as schema from '@/db/schema';
import { users, workouts } from '@/db/schema';
import { ADMIN_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';

const sqlite = new Database(':memory:');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

vi.doMock('@/db', () => ({ db }));

let getLeaderboard: typeof import('@/lib/actions/leaderboard').getLeaderboard;
let getUserLifetimeStats: typeof import('@/lib/actions/leaderboard').getUserLifetimeStats;

type LeaderboardSort = import('@/lib/actions/leaderboard').LeaderboardSort;

beforeAll(async () => {
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  const leaderboardModule = await import('@/lib/actions/leaderboard');
  getLeaderboard = leaderboardModule.getLeaderboard;
  getUserLifetimeStats = leaderboardModule.getUserLifetimeStats;
});

beforeEach(async () => {
  sqlite.exec('delete from workouts; delete from users;');
});

afterAll(() => {
  sqlite.close();
});

async function insertUsers() {
  await db.insert(users).values([
    { id: 1, username: 'alice', password: 'hashed-password', role: USER_ROLE },
    { id: 2, username: 'bob', password: 'hashed-password', role: USER_ROLE },
    { id: 3, username: 'charlie', password: 'hashed-password', role: USER_ROLE },
    { id: 4, username: 'dana', password: 'hashed-password', role: USER_ROLE },
    { id: 5, username: 'eve', password: 'hashed-password', role: USER_ROLE },
    { id: 6, username: 'admin-user', password: 'hashed-password', role: ADMIN_ROLE },
  ]);
}

// ---------------------------------------------------------------------------
// getLeaderboard
// ---------------------------------------------------------------------------
describe('getLeaderboard', () => {
  it('returns an empty array when there are no completed workouts', async () => {
    await insertUsers();

    await expect(getLeaderboard()).resolves.toEqual([]);
  });

  it('maps rows to leaderboard entries with aggregate totals and rank assignment', async () => {
    await insertUsers();
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-10 12:00:00',
        endTime: '2026-04-10 13:00:00',
        totalDistanceKm: 10,
        totalCalories: 500,
        totalElevationGain: 50,
        xpEarned: 200,
      },
      {
        userId: 2,
        startTime: '2026-04-11 09:00:00',
        endTime: '2026-04-11 09:40:00',
        totalDistanceKm: 8,
        totalCalories: 400,
        totalElevationGain: 30,
        xpEarned: 150,
      },
    ]);

    const result = await getLeaderboard();

    expect(result).toEqual([
      {
        userId: 1,
        username: 'alice',
        totalDistanceKm: 10,
        totalCalories: 500,
        totalXp: 200,
        totalElevationGain: 50,
        totalDurationSeconds: 3600,
        workoutCount: 1,
        rank: 1,
      },
      {
        userId: 2,
        username: 'bob',
        totalDistanceKm: 8,
        totalCalories: 400,
        totalXp: 150,
        totalElevationGain: 30,
        totalDurationSeconds: 2400,
        workoutCount: 1,
        rank: 2,
      },
    ]);
  });

  it('assigns sequential ranks starting at 1', async () => {
    await insertUsers();
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-10 12:00:00',
        endTime: '2026-04-10 12:30:00',
        xpEarned: 500,
      },
      {
        userId: 2,
        startTime: '2026-04-10 13:00:00',
        endTime: '2026-04-10 13:30:00',
        xpEarned: 400,
      },
      {
        userId: 3,
        startTime: '2026-04-10 14:00:00',
        endTime: '2026-04-10 14:30:00',
        xpEarned: 300,
      },
      {
        userId: 4,
        startTime: '2026-04-10 15:00:00',
        endTime: '2026-04-10 15:30:00',
        xpEarned: 200,
      },
      {
        userId: 5,
        startTime: '2026-04-10 16:00:00',
        endTime: '2026-04-10 16:30:00',
        xpEarned: 100,
      },
    ]);

    const result = await getLeaderboard();

    result.forEach((entry, index) => {
      expect(entry.rank).toBe(index + 1);
    });
  });

  it('defaults to xp sorting when no sortBy is provided', async () => {
    await insertUsers();
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-12 10:00:00',
        endTime: '2026-04-12 11:00:00',
        totalDistanceKm: 25,
        xpEarned: 50,
      },
      {
        userId: 2,
        startTime: '2026-04-12 12:00:00',
        endTime: '2026-04-12 12:20:00',
        totalDistanceKm: 10,
        xpEarned: 200,
      },
    ]);

    const result = await getLeaderboard();

    expect(result.map((entry) => entry.username)).toEqual(['bob', 'alice']);
  });

  it('excludes admin users from the leaderboard results', async () => {
    await insertUsers();
    await db.insert(workouts).values([
      {
        userId: 6,
        startTime: '2026-04-13 08:00:00',
        endTime: '2026-04-13 09:00:00',
        totalDistanceKm: 50,
        totalCalories: 800,
        totalElevationGain: 120,
        xpEarned: 1000,
      },
      {
        userId: 1,
        startTime: '2026-04-13 10:00:00',
        endTime: '2026-04-13 10:45:00',
        totalDistanceKm: 5,
        totalCalories: 200,
        totalElevationGain: 20,
        xpEarned: 100,
      },
    ]);

    const result = await getLeaderboard();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ userId: 1, username: 'alice' });
  });

  it.each<LeaderboardSort>(['xp', 'distance', 'calories', 'elevation', 'duration'])(
    'supports sortBy = %s with completed workouts',
    async (sortBy) => {
      await insertUsers();
      await db.insert(workouts).values({
        userId: 1,
        startTime: '2026-04-14 08:00:00',
        endTime: '2026-04-14 08:30:00',
        totalDistanceKm: 4,
        totalCalories: 180,
        totalElevationGain: 12,
        xpEarned: 90,
      });

      const result = await getLeaderboard(sortBy);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ userId: 1, username: 'alice', rank: 1 });
    }
  );
});

// ---------------------------------------------------------------------------
// getUserLifetimeStats
// ---------------------------------------------------------------------------
describe('getUserLifetimeStats', () => {
  it('returns null when the user has no completed workouts', async () => {
    await insertUsers();
    await db.insert(workouts).values({
      userId: 1,
      startTime: '2026-04-15 09:00:00',
      endTime: null,
      totalDistanceKm: 4,
      totalCalories: 180,
      totalElevationGain: 12,
      xpEarned: 90,
    });

    await expect(getUserLifetimeStats(1)).resolves.toBeNull();
  });

  it('returns null when the user has no workouts at all', async () => {
    await insertUsers();

    await expect(getUserLifetimeStats(1)).resolves.toBeNull();
  });

  it('returns aggregated stats for a user with completed workouts', async () => {
    await insertUsers();
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-16 07:00:00',
        endTime: '2026-04-16 07:30:00',
        totalDistanceKm: 10.5,
        totalCalories: 500,
        totalElevationGain: 20,
        xpEarned: 150,
      },
      {
        userId: 1,
        startTime: '2026-04-17 07:00:00',
        endTime: '2026-04-17 07:45:00',
        totalDistanceKm: 15,
        totalCalories: 700,
        totalElevationGain: 30,
        xpEarned: 300,
      },
    ]);

    const result = await getUserLifetimeStats(1);

    expect(result).toEqual({
      totalDistanceKm: 25.5,
      totalCalories: 1200,
      totalXp: 450,
      workoutCount: 2,
    });
  });
});
