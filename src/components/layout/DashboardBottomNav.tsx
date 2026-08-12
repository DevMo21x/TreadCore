'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { discardCurrentGuestAccount } from '@/lib/actions/user';
import { useWorkoutStore } from '@/stores';
import { type ThemeMode } from '@/lib/users/themeMode';
import { GuestLogoutModal } from './GuestLogoutModal';
import { ThemeToggle } from './ThemeToggle';

type DashboardBottomNavProps = Readonly<{
  isGuest?: boolean;
  initialThemeMode: ThemeMode;
  canPersistTheme: boolean;
}>;

const GUEST_LOGOUT_CALLBACK_URL = '/';
const GUEST_SIGNUP_URL = '/signup?guest=promote';

type NavItem = {
  label: string;
  icon: 'dashboard' | 'presets' | 'videos' | 'more' | 'logout';
  href?: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { label: 'Presets', icon: 'presets', href: '/dashboard/presets' },
  { label: 'Videos', icon: 'videos', href: '/dashboard/videos' },
  { label: 'More', icon: 'more', href: '/dashboard/more' },
  { label: 'Logout', icon: 'logout' },
];

function BottomNavIcon({
  icon,
  className = 'h-5 w-5',
}: Readonly<{
  icon: NavItem['icon'];
  className?: string;
}>) {
  switch (icon) {
    case 'dashboard':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <path d="M4 4h7v7H4z" />
          <path d="M13 4h7v4h-7z" />
          <path d="M13 10h7v10h-7z" />
          <path d="M4 13h7v7H4z" />
        </svg>
      );
    case 'presets':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      );
    case 'videos':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="m10 9 4 3-4 3Z" fill="currentColor" stroke="none" />
          <path d="m17 10 4-2v8l-4-2" />
        </svg>
      );
    case 'more':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          <circle cx="17" cy="7" r="1.5" fill="currentColor" />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="17" cy="12" r="1.5" fill="currentColor" />
          <circle cx="7" cy="17" r="1.5" fill="currentColor" />
          <circle cx="12" cy="17" r="1.5" fill="currentColor" />
          <circle cx="17" cy="17" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'logout':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    default:
      return null;
  }
}

export function DashboardBottomNav({
  isGuest = false,
  initialThemeMode,
  canPersistTheme,
}: DashboardBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isGuestLogoutOpen, setIsGuestLogoutOpen] = useState(false);
  const [isDiscardingGuest, setIsDiscardingGuest] = useState(false);
  const [guestLogoutError, setGuestLogoutError] = useState('');

  async function handleLogout() {
    if (!isGuest) {
      await signOut({ callbackUrl: GUEST_LOGOUT_CALLBACK_URL });
      return;
    }

    setGuestLogoutError('');
    setIsGuestLogoutOpen(true);
  }

  function handleGuestSignup() {
    if (isDiscardingGuest) {
      return;
    }

    setGuestLogoutError('');
    setIsGuestLogoutOpen(false);
    router.push(GUEST_SIGNUP_URL);
  }

  function handleCloseGuestLogout() {
    if (isDiscardingGuest) {
      return;
    }

    setGuestLogoutError('');
    setIsGuestLogoutOpen(false);
  }

  async function handleDiscardGuestSession() {
    if (isDiscardingGuest) {
      return;
    }

    setIsDiscardingGuest(true);
    setGuestLogoutError('');

    try {
      await discardCurrentGuestAccount();
      useWorkoutStore.getState().reset();
      await signOut({ callbackUrl: GUEST_LOGOUT_CALLBACK_URL });
    } catch (error) {
      setGuestLogoutError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again later.'
      );
      setIsDiscardingGuest(false);
    }
  }

  function getIsActive(item: NavItem): boolean {
    if (!item.href) return false; // Logout button is never active
    if (item.href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(item.href);
  }

  function getItemClasses(item: NavItem): string {
    const isActive = getIsActive(item);
    const baseClasses =
      'flex items-center justify-center gap-4 flex-1 rounded-sm border py-2 text-2xl font-bold tracking-widest transition-all';

    if (isActive) {
      return `${baseClasses} border-[rgba(189,244,255,0.5)] bg-[rgba(189,244,255,0.2)] text-[var(--hg-text)] shadow-[0_0_5px_rgba(0,227,253,0.3)]`;
    }

    return `${baseClasses} border-[color:var(--hg-border-soft)] text-[var(--hg-muted)] hover:bg-[color:var(--hg-interactive-soft)] hover:text-[var(--hg-text)]`;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <ThemeToggle
          initialThemeMode={initialThemeMode}
          canPersistTheme={canPersistTheme}
          isGuest={isGuest}
        />
        <div className="glass-panel flex flex-1 gap-2 rounded-xl border border-[color:var(--hg-border-soft)] p-2">
          {NAV_ITEMS.map((item) => {
            if (item.icon === 'logout') {
              return (
                <button
                  key="logout"
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className={getItemClasses(item)}
                >
                  <BottomNavIcon icon={item.icon} />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={item.href} href={item.href || '#'} className={getItemClasses(item)}>
                <BottomNavIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <GuestLogoutModal
        isOpen={isGuestLogoutOpen && isGuest}
        isDiscarding={isDiscardingGuest}
        error={guestLogoutError}
        onSignup={handleGuestSignup}
        onDiscard={handleDiscardGuestSession}
        onClose={handleCloseGuestLogout}
      />
    </>
  );
}
