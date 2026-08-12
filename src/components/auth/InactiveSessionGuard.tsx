'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import {
  createInactivityTimer,
  INACTIVE_LOGOUT_CALLBACK_URL,
  type InactivityTimer,
} from '@/lib/core/inactiveLogout';
import { useWorkoutStore } from '@/stores';

export function InactiveSessionGuard({
  children,
  callbackUrl = INACTIVE_LOGOUT_CALLBACK_URL,
}: Readonly<{
  children: React.ReactNode;
  callbackUrl?: string;
}>) {
  const isWorkoutRunning = useWorkoutStore((state) => state.status === 'running');
  const timerRef = useRef<InactivityTimer | null>(null);
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    const timer = createInactivityTimer({
      onTimeout: () => {
        if (isSigningOutRef.current) {
          return;
        }

        isSigningOutRef.current = true;
        useWorkoutStore.getState().reset();
        void signOut({ callbackUrl });
      },
    });

    timerRef.current = timer;
    timer.markActivity();

    const handleActivity = () => {
      const activeTimer = timerRef.current;

      if (!activeTimer || isSigningOutRef.current) {
        return;
      }

      activeTimer.markActivity();

      if (useWorkoutStore.getState().status === 'running') {
        activeTimer.pause();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };

    window.addEventListener('keydown', handleActivity);
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      timer.clear();
      timerRef.current = null;
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callbackUrl]);

  useEffect(() => {
    const timer = timerRef.current;

    if (!timer || isSigningOutRef.current) {
      return;
    }

    if (isWorkoutRunning) {
      timer.pause();
      return;
    }

    timer.resume();
  }, [isWorkoutRunning]);

  return <>{children}</>;
}
