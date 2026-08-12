import { z } from 'zod';
import { toAuthSessionUser, type AppUserRole } from '@/lib/auth/sessionUser';

export class RetryLaterSignal extends Error {}

const signInSchema = z.object({
  username: z.string().min(1),
  pin: z.string().min(1),
});

type AuthorizeDependencies = {
  findUserByUsername: (username: string) => Promise<{
    id: number;
    username: string;
    password: string;
    role: AppUserRole;
  } | null>;
  verifyPin: (pin: string, storedHash: string) => Promise<boolean>;
  getLoginThrottleStatus: (username: string) => {
    locked: boolean;
    retryAfterSeconds: number;
    remainingAttempts: number;
  };
  recordFailedLoginAttempt: (username: string) => {
    locked: boolean;
    retryAfterSeconds: number;
    remainingAttempts: number;
  };
  clearLoginThrottle: (username: string) => void;
};

async function loadDefaultDependencies(): Promise<AuthorizeDependencies> {
  const [
    { findUserByUsername },
    { clearLoginThrottle, getLoginThrottleStatus, recordFailedLoginAttempt },
    { verifyPin },
  ] = await Promise.all([
    import('@/lib/users/userService'),
    import('@/lib/core/rateLimit'),
    import('@/lib/auth/scrypt'),
  ]);

  return {
    findUserByUsername,
    verifyPin,
    getLoginThrottleStatus,
    recordFailedLoginAttempt,
    clearLoginThrottle,
  };
}

export async function authorizeCredentials(
  credentials: unknown,
  dependencies?: AuthorizeDependencies
) {
  const resolvedDependencies = dependencies ?? (await loadDefaultDependencies());
  const parsed = signInSchema.safeParse(credentials);

  if (!parsed.success) {
    return null;
  }

  const username = parsed.data.username.trim();

  if (resolvedDependencies.getLoginThrottleStatus(username).locked) {
    throw new RetryLaterSignal();
  }

  const user = await resolvedDependencies.findUserByUsername(username);

  if (!user) {
    const throttleStatus = resolvedDependencies.recordFailedLoginAttempt(username);

    if (throttleStatus.locked) {
      throw new RetryLaterSignal();
    }

    return null;
  }

  const isValidPin = await resolvedDependencies.verifyPin(parsed.data.pin, user.password);

  if (!isValidPin) {
    const throttleStatus = resolvedDependencies.recordFailedLoginAttempt(username);

    if (throttleStatus.locked) {
      throw new RetryLaterSignal();
    }

    return null;
  }

  resolvedDependencies.clearLoginThrottle(username);

  return toAuthSessionUser(user);
}
