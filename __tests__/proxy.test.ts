import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

const { mockAuthWrapper, mockGetAppRouteAuthorization } = vi.hoisted(() => ({
  mockAuthWrapper: vi.fn((handler) => handler),
  mockGetAppRouteAuthorization: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: mockAuthWrapper,
  getAppRouteAuthorization: mockGetAppRouteAuthorization,
}));

import { config, proxy } from '../src/proxy';

describe('proxy', () => {
  it('keeps matcher literals inline for Next.js static analysis', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/proxy.ts'), 'utf8');

    expect(config.matcher).toEqual(['/dashboard/:path*', '/admin/:path*', '/profile/:path*']);
    expect(source).not.toMatch(/PROTECTED_APP_ROUTE_MATCHERS/);
    expect(source).toMatch(
      /matcher:\s*\[\s*'\/dashboard\/:path\*'\s*,\s*'\/admin\/:path\*'\s*,\s*'\/profile\/:path\*'\s*\]/
    );
  });

  it('redirects unauthenticated admin requests to the login page', async () => {
    mockGetAppRouteAuthorization.mockReturnValueOnce({ authorized: false, redirectTo: '/login' });

    const response = (await proxy(
      {
        auth: null,
        nextUrl: new URL('http://localhost/admin/videos'),
      } as any,
      {} as any
    )) as Response;

    expect(response.headers.get('location')).toBe('http://localhost/login');
  });

  it('redirects non-admin admin requests to the dashboard', async () => {
    mockGetAppRouteAuthorization.mockReturnValueOnce({
      authorized: false,
      redirectTo: '/dashboard',
    });

    const response = (await proxy(
      {
        auth: { user: { role: 'guest' } },
        nextUrl: new URL('http://localhost/admin/videos'),
      } as any,
      {} as any
    )) as Response;

    expect(response.headers.get('location')).toBe('http://localhost/dashboard');
  });
});
