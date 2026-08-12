import { LOGIN_ATTEMPT_LIMIT, getLoginThrottleStatus } from '@/lib/core/rateLimit';

const FALLBACK_THROTTLE_STATUS = {
  locked: false,
  retryAfterSeconds: 0,
  remainingAttempts: LOGIN_ATTEMPT_LIMIT,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim();

  if (!username) {
    return Response.json(FALLBACK_THROTTLE_STATUS);
  }

  return Response.json(getLoginThrottleStatus(username));
}
