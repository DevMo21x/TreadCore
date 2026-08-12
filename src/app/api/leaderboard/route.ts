import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, type LeaderboardSort } from '@/lib/actions/leaderboard';

const VALID_SORT_VALUES: LeaderboardSort[] = [
  'xp',
  'distance',
  'calories',
  'elevation',
  'duration',
];

/**
 * GET /api/leaderboard?sortBy=xp
 * Returns all users ranked by the given statistic across completed workouts.
 * sortBy defaults to 'xp' if not provided.
 */
export async function GET(req: NextRequest) {
  const sortBy = req.nextUrl.searchParams.get('sortBy') ?? 'xp';

  if (!VALID_SORT_VALUES.includes(sortBy as LeaderboardSort)) {
    return NextResponse.json(
      { error: `Invalid sortBy value. Must be one of: ${VALID_SORT_VALUES.join(', ')}` },
      { status: 400 }
    );
  }

  const entries = await getLeaderboard(sortBy as LeaderboardSort);
  return NextResponse.json(entries, { status: 200 });
}
