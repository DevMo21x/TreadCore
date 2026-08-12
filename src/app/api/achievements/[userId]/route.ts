import { NextRequest, NextResponse } from 'next/server';
import { getUserAchievements } from '@/db/queries/achievements';

/**
 * GET /api/achievements/[userId]
 * Returns all achievements earned by the specified user as a JSON array.
 * The userId path parameter must be a valid positive integer.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: rawUserId } = await params;
  const userId = Number(rawUserId);

  // Reject the request when the user identifier is not a valid positive integer
  if (!Number.isFinite(userId) || userId <= 0 || !Number.isInteger(userId)) {
    return NextResponse.json(
      { error: 'The userId parameter must be a valid positive integer.' },
      { status: 400 }
    );
  }

  const achievements = await getUserAchievements(userId);
  return NextResponse.json(achievements, { status: 200 });
}
