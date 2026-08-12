import NodeCache from 'node-cache';

export const LOGIN_ATTEMPT_LIMIT = 5;
export const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;
export const LOCKOUT_SCHEDULE_SECONDS = [30, 60, 120, 300, 900] as const;
const LOGIN_THROTTLE_NAMESPACE = 'login_throttle';
const PIN_CHANGE_THROTTLE_NAMESPACE = 'pin_change_throttle';

export type LoginThrottleState = {
  failures: number;
  windowExpiresAt: number;
  lockedUntil: number | null;
  lockoutLevel: number;
  lastFailureAt: number;
};

export type LoginThrottleStatus = {
  locked: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
};

const rateLimitCache = new NodeCache({
  stdTTL: 0,
  checkperiod: 60,
  maxKeys: 10_000,
});

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function getCacheKey(namespace: string, identifier: string) {
  return `${namespace}:${normalizeIdentifier(identifier)}`;
}

function getRetryAfterSeconds(lockedUntil: number, now: number) {
  return Math.max(1, Math.ceil((lockedUntil - now) / 1000));
}

function getStateTtlSeconds(state: LoginThrottleState, now: number) {
  const expiresAt = Math.max(state.windowExpiresAt, state.lockedUntil ?? 0);
  return Math.max(1, Math.ceil((expiresAt - now) / 1000));
}

function isActiveLockout(state: LoginThrottleState, now: number) {
  return state.lockedUntil !== null && state.lockedUntil > now;
}

function readState(namespace: string, identifier: string, now = Date.now()) {
  const key = getCacheKey(namespace, identifier);
  const state = rateLimitCache.get<LoginThrottleState>(key);

  if (!state) {
    return null;
  }

  if (!isActiveLockout(state, now) && state.windowExpiresAt <= now) {
    rateLimitCache.del(key);
    return null;
  }

  return state;
}

function writeState(namespace: string, identifier: string, state: LoginThrottleState, now: number) {
  rateLimitCache.set(getCacheKey(namespace, identifier), state, getStateTtlSeconds(state, now));
}

function getNextLockoutDurationSeconds(lockoutLevel: number) {
  return LOCKOUT_SCHEDULE_SECONDS[Math.min(lockoutLevel, LOCKOUT_SCHEDULE_SECONDS.length - 1)];
}

export function getLoginThrottleStatus(identifier: string, now = Date.now()): LoginThrottleStatus {
  const state = readState(LOGIN_THROTTLE_NAMESPACE, identifier, now);

  if (!state) {
    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: LOGIN_ATTEMPT_LIMIT,
    };
  }

  if (isActiveLockout(state, now) && state.lockedUntil !== null) {
    return {
      locked: true,
      retryAfterSeconds: getRetryAfterSeconds(state.lockedUntil, now),
      remainingAttempts: 0,
    };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, LOGIN_ATTEMPT_LIMIT - state.failures),
  };
}

export function recordFailedLoginAttempt(
  identifier: string,
  now = Date.now()
): LoginThrottleStatus {
  const existingState = readState(LOGIN_THROTTLE_NAMESPACE, identifier, now);

  if (!existingState) {
    writeState(
      LOGIN_THROTTLE_NAMESPACE,
      identifier,
      {
        failures: 1,
        windowExpiresAt: now + LOGIN_ATTEMPT_WINDOW_SECONDS * 1000,
        lockedUntil: null,
        lockoutLevel: 0,
        lastFailureAt: now,
      },
      now
    );

    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: LOGIN_ATTEMPT_LIMIT - 1,
    };
  }

  if (isActiveLockout(existingState, now) && existingState.lockedUntil !== null) {
    return {
      locked: true,
      retryAfterSeconds: getRetryAfterSeconds(existingState.lockedUntil, now),
      remainingAttempts: 0,
    };
  }

  const failures = existingState.failures + 1;

  if (failures >= LOGIN_ATTEMPT_LIMIT) {
    const lockoutDurationSeconds = getNextLockoutDurationSeconds(existingState.lockoutLevel);

    writeState(
      LOGIN_THROTTLE_NAMESPACE,
      identifier,
      {
        failures: 0,
        windowExpiresAt: existingState.windowExpiresAt,
        lockedUntil: now + lockoutDurationSeconds * 1000,
        lockoutLevel: existingState.lockoutLevel + 1,
        lastFailureAt: now,
      },
      now
    );

    return {
      locked: true,
      retryAfterSeconds: lockoutDurationSeconds,
      remainingAttempts: 0,
    };
  }

  writeState(
    LOGIN_THROTTLE_NAMESPACE,
    identifier,
    {
      ...existingState,
      failures,
      lockedUntil: null,
      lastFailureAt: now,
    },
    now
  );

  return {
    locked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, LOGIN_ATTEMPT_LIMIT - failures),
  };
}

export function clearLoginThrottle(identifier: string) {
  rateLimitCache.del(getCacheKey(LOGIN_THROTTLE_NAMESPACE, identifier));
}

export type PinChangeThrottleStatus = LoginThrottleStatus;

export function getPinChangeThrottleStatus(
  identifier: string,
  now = Date.now()
): PinChangeThrottleStatus {
  const state = readState(PIN_CHANGE_THROTTLE_NAMESPACE, identifier, now);

  if (!state) {
    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: LOGIN_ATTEMPT_LIMIT,
    };
  }

  if (isActiveLockout(state, now) && state.lockedUntil !== null) {
    return {
      locked: true,
      retryAfterSeconds: getRetryAfterSeconds(state.lockedUntil, now),
      remainingAttempts: 0,
    };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, LOGIN_ATTEMPT_LIMIT - state.failures),
  };
}

export function recordFailedPinChangeAttempt(
  identifier: string,
  now = Date.now()
): PinChangeThrottleStatus {
  const existingState = readState(PIN_CHANGE_THROTTLE_NAMESPACE, identifier, now);

  if (!existingState) {
    writeState(
      PIN_CHANGE_THROTTLE_NAMESPACE,
      identifier,
      {
        failures: 1,
        windowExpiresAt: now + LOGIN_ATTEMPT_WINDOW_SECONDS * 1000,
        lockedUntil: null,
        lockoutLevel: 0,
        lastFailureAt: now,
      },
      now
    );

    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: LOGIN_ATTEMPT_LIMIT - 1,
    };
  }

  if (isActiveLockout(existingState, now) && existingState.lockedUntil !== null) {
    return {
      locked: true,
      retryAfterSeconds: getRetryAfterSeconds(existingState.lockedUntil, now),
      remainingAttempts: 0,
    };
  }

  const failures = existingState.failures + 1;

  if (failures >= LOGIN_ATTEMPT_LIMIT) {
    const lockoutDurationSeconds = getNextLockoutDurationSeconds(existingState.lockoutLevel);

    writeState(
      PIN_CHANGE_THROTTLE_NAMESPACE,
      identifier,
      {
        failures: 0,
        windowExpiresAt: existingState.windowExpiresAt,
        lockedUntil: now + lockoutDurationSeconds * 1000,
        lockoutLevel: existingState.lockoutLevel + 1,
        lastFailureAt: now,
      },
      now
    );

    return {
      locked: true,
      retryAfterSeconds: lockoutDurationSeconds,
      remainingAttempts: 0,
    };
  }

  writeState(
    PIN_CHANGE_THROTTLE_NAMESPACE,
    identifier,
    {
      ...existingState,
      failures,
      lockedUntil: null,
      lastFailureAt: now,
    },
    now
  );

  return {
    locked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, LOGIN_ATTEMPT_LIMIT - failures),
  };
}

export function clearPinChangeThrottle(identifier: string) {
  rateLimitCache.del(getCacheKey(PIN_CHANGE_THROTTLE_NAMESPACE, identifier));
}

export function resetLoginThrottleCache() {
  rateLimitCache.flushAll();
}

export function resetPinChangeThrottleCache() {
  rateLimitCache.flushAll();
}
