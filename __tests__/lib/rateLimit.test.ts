import {
  clearLoginThrottle,
  clearPinChangeThrottle,
  getLoginThrottleStatus,
  getPinChangeThrottleStatus,
  recordFailedLoginAttempt,
  recordFailedPinChangeAttempt,
  resetLoginThrottleCache,
  resetPinChangeThrottleCache,
} from '@/lib/core/rateLimit';
import { afterEach, describe, expect, it } from 'vitest';

describe('rateLimit', () => {
  afterEach(() => {
    resetLoginThrottleCache();
    resetPinChangeThrottleCache();
  });

  it('tracks remaining attempts before lockout', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    expect(recordFailedLoginAttempt('alice', now)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    });

    expect(getLoginThrottleStatus('alice', now + 1_000)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    });
  });

  it('locks after the fifth failed attempt', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      recordFailedLoginAttempt('bob', now + attempt * 1_000);
    }

    expect(recordFailedLoginAttempt('bob', now + 4_000)).toEqual({
      locked: true,
      retryAfterSeconds: 30,
      remainingAttempts: 0,
    });

    expect(getLoginThrottleStatus('bob', now + 5_000)).toEqual({
      locked: true,
      retryAfterSeconds: 29,
      remainingAttempts: 0,
    });
  });

  it('escalates repeated lockouts inside the same window', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordFailedLoginAttempt('charlie', now + attempt * 1_000);
    }

    const secondBurstStart = now + 35_000;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      recordFailedLoginAttempt('charlie', secondBurstStart + attempt * 1_000);
    }

    expect(recordFailedLoginAttempt('charlie', secondBurstStart + 4_000)).toEqual({
      locked: true,
      retryAfterSeconds: 60,
      remainingAttempts: 0,
    });
  });

  it('resets state after a successful login', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    recordFailedLoginAttempt('dana', now);
    clearLoginThrottle('dana');

    expect(getLoginThrottleStatus('dana', now + 1_000)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 5,
    });
  });

  it('drops stale state after the observation window expires', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    recordFailedLoginAttempt('eve', now);

    expect(getLoginThrottleStatus('eve', now + 15 * 60 * 1000 + 1)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 5,
    });
  });

  it('tracks remaining PIN change attempts before lockout', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    expect(recordFailedPinChangeAttempt('user:1', now)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    });

    expect(getPinChangeThrottleStatus('user:1', now + 1_000)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    });
  });

  it('locks PIN changes after the fifth failed attempt', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      recordFailedPinChangeAttempt('user:2', now + attempt * 1_000);
    }

    expect(recordFailedPinChangeAttempt('user:2', now + 4_000)).toEqual({
      locked: true,
      retryAfterSeconds: 30,
      remainingAttempts: 0,
    });

    expect(getPinChangeThrottleStatus('user:2', now + 5_000)).toEqual({
      locked: true,
      retryAfterSeconds: 29,
      remainingAttempts: 0,
    });
  });

  it('resets PIN change state after a successful verification', () => {
    const now = Date.UTC(2026, 3, 27, 12, 0, 0);

    recordFailedPinChangeAttempt('user:3', now);
    clearPinChangeThrottle('user:3');

    expect(getPinChangeThrottleStatus('user:3', now + 1_000)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 5,
    });
  });
});
