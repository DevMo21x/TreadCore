'use client';

import { SessionProvider } from 'next-auth/react';
import { useHardwareFeedback } from '@/hooks/useHardwareFeedback';

/**
 * Client-side providers and hooks.
 * This component is mounted in the root layout to enable client-side features.
 * Combines auth (SessionProvider) and hardware feedback (SSE via useHardwareFeedback).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Subscribe to hardware feedback via SSE
  useHardwareFeedback();

  return <SessionProvider>{children}</SessionProvider>;
}
