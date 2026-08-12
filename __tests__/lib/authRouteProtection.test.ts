import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';
import { PROTECTED_APP_ROUTE_PREFIXES, isProtectedAppRoute } from '@/lib/auth/routeProtection';

const { mockNextAuth, mockCredentialsProvider } = vi.hoisted(() => ({
  mockNextAuth: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  mockCredentialsProvider: vi.fn((config) => config),
}));

vi.mock('next-auth', () => ({
  default: mockNextAuth,
  CredentialsSignin: class CredentialsSignin extends Error {},
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: mockCredentialsProvider,
}));

vi.mock('@/lib/users/userService', () => ({
  createGuestUser: vi.fn(),
}));

vi.mock('@/lib/auth/authorizeCredentials', () => ({
  RetryLaterSignal: class RetryLaterSignal extends Error {},
  authorizeCredentials: vi.fn(),
}));

import { authorizeAppRoute, getAppRouteAuthorization } from '@/auth';

function buildUrl(pathname: string) {
  return new URL(`http://localhost${pathname}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authorizeAppRoute', () => {
  it('allows public routes without authentication', () => {
    expect(authorizeAppRoute({ auth: null, nextUrl: buildUrl('/login') })).toBe(true);
  });

  it('requires authentication for dashboard routes', () => {
    expect(authorizeAppRoute({ auth: null, nextUrl: buildUrl('/dashboard') })).toBe(false);
    expect(
      authorizeAppRoute({
        auth: { user: { role: USER_ROLE } },
        nextUrl: buildUrl('/dashboard/leaderboard'),
      })
    ).toBe(true);
  });

  it('returns false for admin routes when unauthenticated', () => {
    expect(authorizeAppRoute({ auth: null, nextUrl: buildUrl('/admin/videos') })).toBe(false);
  });

  it('returns false for admin routes when the user is not an admin', () => {
    expect(
      authorizeAppRoute({
        auth: { user: { role: USER_ROLE } },
        nextUrl: buildUrl('/admin/videos'),
      })
    ).toBe(false);
  });

  it('allows admins through admin routes', () => {
    expect(
      authorizeAppRoute({
        auth: { user: { role: ADMIN_ROLE } },
        nextUrl: buildUrl('/admin/videos'),
      })
    ).toBe(true);
  });
});

describe('getAppRouteAuthorization', () => {
  it('redirects unauthenticated users away from admin routes', () => {
    const result = getAppRouteAuthorization({ auth: null, nextUrl: buildUrl('/admin/videos') });

    expect(result).toEqual({ authorized: false, redirectTo: '/login' });
  });

  it('redirects non-admin users from admin routes to the dashboard', () => {
    const result = getAppRouteAuthorization({
      auth: { user: { role: USER_ROLE } },
      nextUrl: buildUrl('/admin/videos'),
    });

    expect(result).toEqual({ authorized: false, redirectTo: '/dashboard' });
  });
});

describe('routeProtection', () => {
  it('includes dashboard, profile, and admin routes in the protected path contract', () => {
    expect(PROTECTED_APP_ROUTE_PREFIXES).toEqual(['/dashboard', '/profile', '/admin']);
    expect(isProtectedAppRoute('/dashboard')).toBe(true);
    expect(isProtectedAppRoute('/dashboard/profile')).toBe(true);
    expect(isProtectedAppRoute('/profile')).toBe(true);
    expect(isProtectedAppRoute('/profile/settings')).toBe(true);
    expect(isProtectedAppRoute('/admin')).toBe(true);
    expect(isProtectedAppRoute('/admin/videos')).toBe(true);
  });

  it('only matches full protected path segments', () => {
    expect(isProtectedAppRoute('/dashboarding')).toBe(false);
    expect(isProtectedAppRoute('/profiled')).toBe(false);
    expect(isProtectedAppRoute('/administer')).toBe(false);
    expect(isProtectedAppRoute('/public')).toBe(false);
  });
});
