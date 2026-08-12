'use client';

import { useState } from 'react';

interface UsernameKeysProps {
  onKey: (key: string) => void;
  compact?: boolean;
}

export function UsernameKeys({ onKey, compact = false }: UsernameKeysProps) {
  const [caps, setCaps] = useState(false);

  const ROWS = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', '_', '-', '<', '>'],
  ];

  function handleKey(key: string) {
    onKey(caps ? key.toUpperCase() : key.toLowerCase());
    if (caps) setCaps(false);
  }

  const alphaKeyClassName = compact
    ? 'glass-panel flex-1 rounded-2xl border border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/74 py-2 text-2xl font-semibold text-(--hg-text) shadow-[0_10px_24px_var(--hg-shadow-depth)] transition-all duration-150 hover:border-[var(--hg-primary)]/20 hover:bg-[var(--hg-white-overlay-subtle)] active:translate-y-px active:border-[var(--hg-primary)]/34 active:bg-[var(--hg-primary-strong)]/14 touch-manipulation'
    : 'glass-panel flex-1 min-w-15 rounded-2xl border border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/74 py-6 text-4xl font-semibold text-(--hg-text) shadow-[0_10px_24px_var(--hg-shadow-depth)] transition-all duration-150 hover:border-[var(--hg-primary)]/20 hover:bg-[var(--hg-white-overlay-subtle)] active:translate-y-px active:border-[var(--hg-primary)]/34 active:bg-[var(--hg-primary-strong)]/14 touch-manipulation';

  const shiftButtonClassName = compact
    ? `flex-1 rounded-2xl border px-4 py-2 text-xl font-semibold shadow-[0_10px_24px_var(--hg-shadow-depth)] transition-all duration-150 touch-manipulation ${
        caps
          ? 'border-[var(--hg-secondary)]/42 bg-[var(--hg-secondary-strong)]/18 text-(--hg-secondary) active:bg-[var(--hg-secondary-strong)]/26'
          : 'border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/74 text-(--hg-text) hover:border-[var(--hg-primary)]/22 hover:bg-[var(--hg-white-overlay-subtle)] active:translate-y-px active:bg-[var(--hg-primary)]/12'
      }`
    : `flex-1 rounded-2xl border px-4 py-5 text-2xl font-semibold shadow-[0_10px_24px_var(--hg-shadow-depth)] transition-all duration-150 touch-manipulation ${
        caps
          ? 'border-[var(--hg-secondary)]/42 bg-[var(--hg-secondary-strong)]/18 text-(--hg-secondary) active:bg-[var(--hg-secondary-strong)]/26'
          : 'border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/74 text-(--hg-text) hover:border-[var(--hg-primary)]/22 hover:bg-[var(--hg-white-overlay-subtle)] active:translate-y-px active:bg-[var(--hg-primary)]/12'
      }`;

  const containerClassName = compact
    ? 'flex h-full flex-col gap-2 w-full'
    : 'flex flex-col gap-3 w-full';

  const rowClassName = compact ? 'flex flex-1 gap-2 w-full' : 'flex gap-3 w-full';

  return (
    <div className={containerClassName}>
      {ROWS.map((row, idx) => (
        <div key={idx} className={rowClassName}>
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className={alphaKeyClassName}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      ))}

      <div className="flex w-full">
        <button
          type="button"
          onClick={() => setCaps((prev) => !prev)}
          className={shiftButtonClassName}
        >
          ⇪ {caps ? 'SHIFT ON' : 'SHIFT'}
        </button>
      </div>
    </div>
  );
}
