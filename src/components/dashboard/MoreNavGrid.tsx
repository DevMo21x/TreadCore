'use client';

import Link from 'next/link';

type MoreNavTile = {
  href: string;
  label: string;
  icon: 'history' | 'leaderboard' | 'achievements' | 'profile' | 'settings' | 'admin';
};

function MoreNavIcon({
  icon,
  className = 'h-8 w-8',
}: Readonly<{
  icon: MoreNavTile['icon'];
  className?: string;
}>) {
  switch (icon) {
    case 'history':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case 'leaderboard':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <path d="M6 20V10" />
          <path d="M12 20V4" />
          <path d="M18 20v-7" />
        </svg>
      );
    case 'achievements':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M8.5 12.5 7 21l5-3 5 3-1.5-8.5" />
        </svg>
      );
    case 'profile':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case 'admin':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 3 4 7v6c0 5 3.5 7.5 8 8 4.5-.5 8-3 8-8V7Z" />
          <path d="M12 9v6" />
          <path d="M9 12h6" />
        </svg>
      );
    default:
      return null;
  }
}

const STATIC_TILES: readonly MoreNavTile[] = [
  { href: '/dashboard/workout-history', label: 'Workout History', icon: 'history' },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { href: '/dashboard/achievements', label: 'Achievements', icon: 'achievements' },
  { href: '/dashboard/profile', label: 'Profile', icon: 'profile' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
];

const ADMIN_TILES: readonly MoreNavTile[] = [
  { href: '/admin', label: 'Admin Dashboard', icon: 'admin' },
];

export function MoreNavGrid({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const tiles = isAdmin ? [...STATIC_TILES, ...ADMIN_TILES] : STATIC_TILES;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {tiles.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="glass-panel flex flex-col items-center gap-3 rounded-xl border border-[color:var(--hg-border-soft)] p-6 text-center transition-colors hover:bg-[color:var(--hg-interactive-soft)]"
        >
          <MoreNavIcon icon={icon} />
          <span className="text-[12px] font-bold tracking-widest text-[color:var(--hg-muted)]">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
