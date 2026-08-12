export const PROTECTED_APP_ROUTE_PREFIXES = ['/dashboard', '/profile', '/admin'] as const;

export function isProtectedAppRoute(pathname: string) {
  return PROTECTED_APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
