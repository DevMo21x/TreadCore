import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/achievements/[userId]/route';

// ---------------------------------------------------------------------------
// Mock getUserAchievements so the database is never contacted during tests.
// ---------------------------------------------------------------------------
const { mockGetUserAchievements } = vi.hoisted(() => ({
  mockGetUserAchievements: vi.fn(),
}));

vi.mock('@/db/queries/achievements', () => ({
  getUserAchievements: mockGetUserAchievements,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Builds the second argument that Next.js passes to dynamic route handlers
function buildRouteContext(userId: string) {
  return { params: Promise.resolve({ userId }) };
}

const mockAchievements = [
  {
    id: 1,
    code: 'first_run',
    name: 'First Run',
    description: 'Complete your first workout session.',
    image_url: '/badges/first_run.png',
    category: 'milestone',
    active: true,
    earned_at: '2026-04-20T14:30:00.000Z',
    source_workout_id: 42,
  },
  {
    id: 2,
    code: 'distance_10k',
    name: '10 Kilometre Club',
    description: 'Run a total of 10 kilometres across all sessions.',
    image_url: '/badges/distance_10k.png',
    category: 'distance',
    active: true,
    earned_at: '2026-04-25T09:15:00.000Z',
    source_workout_id: 58,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/achievements/[userId]', () => {
  it('returns 200 with the achievements earned by the specified user', async () => {
    mockGetUserAchievements.mockResolvedValue(mockAchievements);

    const request = new NextRequest('http://localhost/api/achievements/1');
    const response = await GET(request, buildRouteContext('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetUserAchievements).toHaveBeenCalledWith(1);
    expect(body).toEqual(mockAchievements);
  });

  it('returns an empty array when the user has no earned achievements', async () => {
    mockGetUserAchievements.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/achievements/5');
    const response = await GET(request, buildRouteContext('5'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetUserAchievements).toHaveBeenCalledWith(5);
    expect(body).toEqual([]);
  });

  it('returns 400 when the userId is not a number', async () => {
    const request = new NextRequest('http://localhost/api/achievements/abc');
    const response = await GET(request, buildRouteContext('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(mockGetUserAchievements).not.toHaveBeenCalled();
  });

  it('returns 400 when the userId is zero', async () => {
    const request = new NextRequest('http://localhost/api/achievements/0');
    const response = await GET(request, buildRouteContext('0'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(mockGetUserAchievements).not.toHaveBeenCalled();
  });

  it('returns 400 when the userId is a negative number', async () => {
    const request = new NextRequest('http://localhost/api/achievements/-3');
    const response = await GET(request, buildRouteContext('-3'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(mockGetUserAchievements).not.toHaveBeenCalled();
  });

  it('returns 400 when the userId is a decimal number', async () => {
    const request = new NextRequest('http://localhost/api/achievements/1.5');
    const response = await GET(request, buildRouteContext('1.5'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(mockGetUserAchievements).not.toHaveBeenCalled();
  });

  it('accepts large valid user identifiers', async () => {
    mockGetUserAchievements.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/achievements/99999');
    const response = await GET(request, buildRouteContext('99999'));

    expect(response.status).toBe(200);
    expect(mockGetUserAchievements).toHaveBeenCalledWith(99999);
  });
});
