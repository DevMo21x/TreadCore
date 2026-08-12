'use client';

import { useRef, useState, useTransition } from 'react';
import { updateCurrentThemeMode } from '@/lib/actions/user';
import { THEME_MODE_DARK, THEME_MODE_LIGHT, type ThemeMode } from '@/lib/users/themeMode';

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2" />
      <path d="M12 19.3v2.2" />
      <path d="m4.9 4.9 1.6 1.6" />
      <path d="m17.5 17.5 1.6 1.6" />
      <path d="M2.5 12h2.2" />
      <path d="M19.3 12h2.2" />
      <path d="m4.9 19.1 1.6-1.6" />
      <path d="m17.5 6.5 1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 14.2A7.8 7.8 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z" />
    </svg>
  );
}

function applyThemeMode(root: Element | null, themeMode: ThemeMode) {
  root?.classList.toggle('light', themeMode === THEME_MODE_LIGHT);
}

export function ThemeToggle({
  initialThemeMode,
  canPersistTheme,
  isGuest,
}: Readonly<{
  initialThemeMode: ThemeMode;
  canPersistTheme: boolean;
  isGuest: boolean;
}>) {
  const [themeMode, setThemeMode] = useState(initialThemeMode);
  const [themeError, setThemeError] = useState('');
  const [isPending, startTransition] = useTransition();
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  const ThemeIcon = themeMode === THEME_MODE_LIGHT ? MoonIcon : SunIcon;
  const nextThemeMode = themeMode === THEME_MODE_LIGHT ? THEME_MODE_DARK : THEME_MODE_LIGHT;
  const themeToggleLabel =
    themeMode === THEME_MODE_LIGHT ? 'Switch to dark mode' : 'Switch to light mode';

  function handleThemeToggle() {
    if (isPending) {
      return;
    }

    const themeRoot = themeButtonRef.current?.closest('.hyper-grid-theme');
    const previousThemeMode = themeMode;

    applyThemeMode(themeRoot, nextThemeMode);
    setThemeMode(nextThemeMode);
    setThemeError('');

    if (!canPersistTheme) {
      return;
    }

    startTransition(() => {
      void updateCurrentThemeMode({ themeMode: nextThemeMode })
        .then((updatedProfile) => {
          applyThemeMode(themeRoot, updatedProfile.themeMode);
          setThemeMode(updatedProfile.themeMode);
        })
        .catch(() => {
          applyThemeMode(themeRoot, previousThemeMode);
          setThemeMode(previousThemeMode);
          setThemeError('Unable to save theme preference.');
        });
    });
  }

  return (
    <>
      <button
        ref={themeButtonRef}
        type="button"
        onClick={handleThemeToggle}
        aria-label={themeToggleLabel}
        aria-pressed={themeMode === THEME_MODE_LIGHT}
        title={
          themeError ||
          (isGuest
            ? `${themeToggleLabel}. Guest theme changes reset when the dashboard reloads.`
            : themeToggleLabel)
        }
        className="rounded-full border border-[color:var(--hg-border-soft)] p-2 text-[var(--hg-muted)] transition-colors hover:bg-[color:var(--hg-interactive-soft)] hover:text-[var(--hg-text)] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        <ThemeIcon />
      </button>
      <span className="sr-only" aria-live="polite">
        {themeError}
      </span>
    </>
  );
}
