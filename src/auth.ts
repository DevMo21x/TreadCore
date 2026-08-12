import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { isProtectedAppRoute } from '@/lib/auth/routeProtection';
import { ADMIN_ROLE, toAuthSessionUser } from '@/lib/auth/sessionUser';
import { createGuestUser } from '@/lib/users/userService';
import { RetryLaterSignal, authorizeCredentials } from '@/lib/auth/authorizeCredentials';

class RetryLaterError extends CredentialsSignin {
  code = 'retry_later';
}

const ADMIN_PATH_PREFIX = '/admin';

type RouteAuthorizationInput = {
  auth: { user?: { role?: string | null } } | null;
  nextUrl: URL;
};

type RouteAuthorizationResult =
  | { authorized: true }
  | { authorized: false; redirectTo: '/login' | '/dashboard' };

export function getAppRouteAuthorization({
  auth,
  nextUrl,
}: RouteAuthorizationInput): RouteAuthorizationResult {
  const pathname = nextUrl.pathname;

  if (pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)) {
    if (!auth) {
      return { authorized: false, redirectTo: '/login' };
    }

    if (auth.user?.role !== ADMIN_ROLE) {
      return { authorized: false, redirectTo: '/dashboard' };
    }

    return { authorized: true };
  }

  if (isProtectedAppRoute(pathname)) {
    if (!auth) {
      return { authorized: false, redirectTo: '/login' };
    }
  }

  return { authorized: true };
}

export function authorizeAppRoute({ auth, nextUrl }: RouteAuthorizationInput) {
  return getAppRouteAuthorization({ auth, nextUrl }).authorized;
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'guest',
      name: 'Guest',
      credentials: {},
      async authorize() {
        const guestUser = await createGuestUser();

        return toAuthSessionUser(guestUser);
      },
    }),
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        try {
          return await authorizeCredentials(credentials);
        } catch (error) {
          if (error instanceof RetryLaterSignal) {
            throw new RetryLaterError();
          }

          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return authorizeAppRoute({ auth, nextUrl });
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = (token.role as 'user' | 'guest' | 'admin') ?? 'user';
      }

      return session;
    },
  },
});
