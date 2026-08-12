/**
 * NextAuth Middleware Proxy
 *
 * This module re-exports the NextAuth `auth` handler as a middleware proxy
 * to protect routes that require authentication.
 */

import { NextResponse } from 'next/server';
import { auth, getAppRouteAuthorization } from '@/auth';

export const proxy = auth((request) => {
  const authorization = getAppRouteAuthorization({
    auth: request.auth,
    nextUrl: request.nextUrl,
  });

  if ('redirectTo' in authorization) {
    return NextResponse.redirect(new URL(authorization.redirectTo, request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Keep these values inline. Next.js statically analyzes proxy matchers and can
  // ignore imported or computed values at build time.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*'],
};
