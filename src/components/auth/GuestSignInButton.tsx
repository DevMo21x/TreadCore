'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export function GuestSignInButton() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  async function handleGuestSignIn() {
    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    setError('');

    try {
      const result = await signIn('guest', { redirect: false });

      if (result?.ok && !result.error) {
        router.push('/dashboard');
        return;
      }

      setError('Unable to start a guest session right now.');
    } catch {
      setError('Unable to start a guest session right now.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <button
        type="button"
        onClick={() => void handleGuestSignIn()}
        disabled={isSigningIn}
        className="group relative w-full overflow-hidden rounded-4xl border border-white/15 bg-[linear-gradient(135deg,rgba(19,19,19,0.96),rgba(42,42,42,0.92))] px-8 py-7 text-left shadow-[0_18px_44px_rgba(0,0,0,0.3)] transition-all duration-150 active:translate-y-px active:border-[rgba(255,178,186,0.42)] active:shadow-[0_12px_28px_rgba(0,0,0,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-tertiary) disabled:cursor-wait disabled:opacity-70"
      >
        <span className="block text-[11px] font-bold tracking-[0.28em] text-(--hg-tertiary)">
          GUEST ACCESS
        </span>
        <span className="mt-3 flex items-center justify-between gap-4">
          <span className="text-2xl font-semibold tracking-[-0.03em] text-(--hg-text)">
            {isSigningIn ? 'Starting Guest Session...' : 'Start Guest Session'}
          </span>
          <span
            aria-hidden="true"
            className="text-3xl text-(--hg-muted) transition-transform duration-150 group-active:translate-x-1"
          >
            →
          </span>
        </span>
      </button>

      {error ? <p className="mt-3 text-sm font-medium text-(--hg-tertiary)">{error}</p> : null}
    </div>
  );
}
