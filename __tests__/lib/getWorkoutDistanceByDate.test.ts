import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '@/db/schema';
import { users, workouts } from '@/db/schema';

// Use an in-memory database so tests are isolated and do not touch the real file
const sqlite = new Database(':memory:');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

// Ensure the query module uses the in-memory database during this test
vi.doMock('@/db', () => ({ db }));

let getWorkoutDistanceByDate: typeof import('@/db/queries/workouts').getWorkoutDistanceByDate;
let getFirstWorkoutDate: typeof import('@/db/queries/workouts').getFirstWorkoutDate;

beforeAll(async () => {
  // Apply migrations so the in-memory database has the required tables
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  const workoutsModule = await import('@/db/queries/workouts');
  getWorkoutDistanceByDate = workoutsModule.getWorkoutDistanceByDate;
  getFirstWorkoutDate = workoutsModule.getFirstWorkoutDate;
});

beforeEach(async () => {
  // Clear tables so each test starts from a clean in-memory database state.
  sqlite.exec('delete from workouts; delete from users;');

  await db.insert(users).values([
    { id: 1, username: 'runner-one', password: 'hashed-password', role: 'user' },
    { id: 2, username: 'runner-two', password: 'hashed-password', role: 'user' },
  ]);
});

afterAll(() => {
  sqlite.close();
});

describe('getWorkoutDistanceByDate', () => {
  it('returns total distance per local date in ascending order, excluding incomplete workouts', async () => {
    // Seed multiple dates with distance values, one incomplete workout and another user
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-10 12:00:00',
        endTime: '2026-04-10 12:45:00',
        totalDistanceKm: 3.5,
      },
      {
        userId: 1,
        startTime: '2026-04-12 10:15:00',
        endTime: '2026-04-12 10:45:00',
        totalDistanceKm: 2.0,
      },
      {
        userId: 1,
        startTime: '2026-04-09 11:30:00',
        endTime: '2026-04-09 12:00:00',
        totalDistanceKm: 1.25,
      },
      {
        userId: 1,
        startTime: '2026-04-10 14:30:00',
        endTime: '2026-04-10 14:50:00',
        totalDistanceKm: 1.5,
      },
      {
        userId: 1,
        startTime: '2026-04-11 09:00:00',
        endTime: null,
        totalDistanceKm: 4.0,
      },
      {
        userId: 2,
        startTime: '2026-04-10 13:00:00',
        endTime: '2026-04-10 13:20:00',
        totalDistanceKm: 10.0,
      },
    ]);

    const results = await getWorkoutDistanceByDate(1);

    // Results should be sorted, distances summed per day, incomplete workout excluded
    expect(results).toEqual([
      { date: '2026-04-09', distanceKm: 1.25 },
      { date: '2026-04-10', distanceKm: 5.0 },
      { date: '2026-04-12', distanceKm: 2.0 },
    ]);
    expect(results.some((row) => row.date === '2026-04-11')).toBe(false);
  });

  it('limits results to the requested local date range', async () => {
    // Seed multiple dates so the range filter has extra rows to exclude
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-10 12:00:00',
        endTime: '2026-04-10 12:45:00',
        totalDistanceKm: 3.0,
      },
      {
        userId: 1,
        startTime: '2026-04-10 14:30:00',
        endTime: '2026-04-10 14:50:00',
        totalDistanceKm: 2.0,
      },
      {
        userId: 1,
        startTime: '2026-04-12 10:15:00',
        endTime: '2026-04-12 10:45:00',
        totalDistanceKm: 5.0,
      },
    ]);

    const results = await getWorkoutDistanceByDate(1, -4, {
      startDate: '2026-04-10',
      endDate: '2026-04-10',
    });

    expect(results).toEqual([{ date: '2026-04-10', distanceKm: 5.0 }]);
  });
});

describe('getFirstWorkoutDate', () => {
  it('returns null when the user has no completed workouts', async () => {
    await db.insert(workouts).values({
      userId: 1,
      startTime: '2026-04-11 09:00:00',
      endTime: null,
    });

    await expect(getFirstWorkoutDate(1)).resolves.toBeNull();
  });

  it('returns the earliest completed workout local date for a user', async () => {
    await db.insert(workouts).values([
      {
        userId: 1,
        startTime: '2026-04-10 00:30:00',
        endTime: '2026-04-10 01:00:00',
      },
      {
        userId: 1,
        startTime: '2026-04-09 15:00:00',
        endTime: '2026-04-09 15:45:00',
      },
      {
        userId: 1,
        startTime: '2026-04-08 09:00:00',
        endTime: null,
      },
      {
        userId: 2,
        startTime: '2026-03-01 08:00:00',
        endTime: '2026-03-01 08:40:00',
      },
    ]);

    // The first row shifts to 2026-04-09 with the default -4 UTC offset.
    await expect(getFirstWorkoutDate(1)).resolves.toBe('2026-04-09');
  });
});
