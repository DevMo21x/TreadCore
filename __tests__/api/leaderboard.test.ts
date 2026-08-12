import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/leaderboard/route';

// ---------------------------------------------------------------------------
// Mock getLeaderboard so no real DB is touched during tests.
// ---------------------------------------------------------------------------
const { mockGetLeaderboard } = vi.hoisted(() => ({
  mockGetLeaderboard: vi.fn(),
}));

vi.mock('@/lib/actions/leaderboard', () => ({
  getLeaderboard: mockGetLeaderboard,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(sortBy?: string) {
  const url = sortBy
    ? `http://localhost/api/leaderboard?sortBy=${sortBy}`
    : 'http://localhost/api/leaderboard';
  return new NextRequest(url);
}

const mockEntries = [
  {
    userId: 1,
    username: 'alice',
    totalXp: 200,
    totalDistanceKm: 10,
    totalCalories: 500,
    totalElevationGain: 50,
    totalDurationSeconds: 3600,
    workoutCount: 3,
    rank: 1,
  },
  {
    userId: 2,
    username: 'bob',
    totalXp: 150,
    totalDistanceKm: 8,
    totalCalories: 400,
    totalElevationGain: 30,
    totalDurationSeconds: 2400,
    workoutCount: 2,
    rank: 2,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/leaderboard', () => {
  it('returns 200 with leaderboard entries using default xp sort', async () => {
    mockGetLeaderboard.mockResolvedValue(mockEntries);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('xp');
    expect(body).toEqual(mockEntries);
  });

  it('passes sortBy=distance to getLeaderboard', async () => {
    mockGetLeaderboard.mockResolvedValue(mockEntries);

    const res = await GET(makeRequest('distance'));

    expect(res.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('distance');
  });

  it('passes sortBy=calories to getLeaderboard', async () => {
    mockGetLeaderboard.mockResolvedValue(mockEntries);

    const res = await GET(makeRequest('calories'));

    expect(res.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('calories');
  });

  it('passes sortBy=elevation to getLeaderboard', async () => {
    mockGetLeaderboard.mockResolvedValue(mockEntries);

    const res = await GET(makeRequest('elevation'));

    expect(res.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('elevation');
  });

  it('passes sortBy=duration to getLeaderboard', async () => {
    mockGetLeaderboard.mockResolvedValue(mockEntries);

    const res = await GET(makeRequest('duration'));

    expect(res.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('duration');
  });

  it('returns 400 for an invalid sortBy value', async () => {
    const res = await GET(makeRequest('invalid'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(mockGetLeaderboard).not.toHaveBeenCalled();
  });

  it('returns an empty array when no users have completed workouts', async () => {
    mockGetLeaderboard.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });
});
