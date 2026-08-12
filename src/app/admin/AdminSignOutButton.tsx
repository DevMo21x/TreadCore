'use client';

import { signOut } from 'next-auth/react';

export function AdminSignOutButton() {
  async function handleSignOut() {
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-md border border-white/10 bg-[rgba(255,178,186,0.12)] px-4 py-2 text-[12px] font-bold tracking-[0.12em] text-[var(--hg-tertiary)] transition hover:bg-[rgba(255,178,186,0.2)]"
    >
      Sign Out
    </button>
  );
}
