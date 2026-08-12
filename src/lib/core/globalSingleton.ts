/**
 * Manages a singleton value on globalThis.
 * Used for shared state between Server Actions and API routes in the same Node.js process.
 * In dev mode, Next.js may reload modules independently, but globalThis persists.
 */
export function globalSingleton<T>(key: string, init: () => T): T {
  const record = globalThis as Record<string, unknown>;
  return (record[key] ??= init()) as T;
}
