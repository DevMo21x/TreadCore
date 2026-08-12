import { RetryLaterSignal, authorizeCredentials } from '@/lib/auth/authorizeCredentials';
import { describe, expect, it, vi } from 'vitest';

describe('authorizeCredentials', () => {
  it('returns null for invalid credential payloads', async () => {
    await expect(authorizeCredentials({}, buildDependencies())).resolves.toBeNull();
  });

  it('throws when the username is already locked', async () => {
    await expect(
      authorizeCredentials(
        { username: 'alice', pin: '1234' },
        buildDependencies({
          getLoginThrottleStatus: vi.fn().mockReturnValue({
            locked: true,
            retryAfterSeconds: 30,
            remainingAttempts: 0,
          }),
        })
      )
    ).rejects.toBeInstanceOf(RetryLaterSignal);
  });

  it('records failures for missing users', async () => {
    const recordFailedLoginAttempt = vi.fn().mockReturnValue({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    });

    await expect(
      authorizeCredentials(
        { username: 'alice', pin: '1234' },
        buildDependencies({
          recordFailedLoginAttempt,
        })
      )
    ).resolves.toBeNull();

    expect(recordFailedLoginAttempt).toHaveBeenCalledWith('alice');
  });

  it('throws when a failed attempt triggers a new lockout', async () => {
    const recordFailedLoginAttempt = vi.fn().mockReturnValue({
      locked: true,
      retryAfterSeconds: 30,
      remainingAttempts: 0,
    });

    await expect(
      authorizeCredentials(
        { username: 'alice', pin: '1234' },
        buildDependencies({
          verifyPin: vi.fn().mockResolvedValue(false),
          findUserByUsername: vi.fn().mockResolvedValue({
            id: 1,
            username: 'alice',
            password: 'stored-hash',
            role: 'user',
          }),
          recordFailedLoginAttempt,
        })
      )
    ).rejects.toBeInstanceOf(RetryLaterSignal);
  });

  it('clears throttle state after a successful login', async () => {
    const clearLoginThrottle = vi.fn();

    await expect(
      authorizeCredentials(
        { username: 'alice', pin: '1234' },
        buildDependencies({
          clearLoginThrottle,
          verifyPin: vi.fn().mockResolvedValue(true),
          findUserByUsername: vi.fn().mockResolvedValue({
            id: 1,
            username: 'alice',
            password: 'stored-hash',
            role: 'user',
          }),
        })
      )
    ).resolves.toEqual({
      id: '1',
      username: 'alice',
      name: 'alice',
      role: 'user',
    });

    expect(clearLoginThrottle).toHaveBeenCalledWith('alice');
  });

  it('preserves the stored role on successful login', async () => {
    await expect(
      authorizeCredentials(
        { username: 'guest', pin: '1234' },
        buildDependencies({
          verifyPin: vi.fn().mockResolvedValue(true),
          findUserByUsername: vi.fn().mockResolvedValue({
            id: 7,
            username: 'guest',
            password: 'stored-hash',
            role: 'guest',
          }),
        })
      )
    ).resolves.toEqual({
      id: '7',
      username: 'guest',
      name: 'Guest',
      role: 'guest',
    });
  });
});

function buildDependencies(overrides: Partial<Parameters<typeof authorizeCredentials>[1]> = {}) {
  return {
    findUserByUsername: vi.fn().mockResolvedValue(null),
    verifyPin: vi.fn().mockResolvedValue(false),
    getLoginThrottleStatus: vi.fn().mockReturnValue({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 5,
    }),
    recordFailedLoginAttempt: vi.fn().mockReturnValue({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    }),
    clearLoginThrottle: vi.fn(),
    ...overrides,
  };
}
