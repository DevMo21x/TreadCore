interface KeyGridProps {
  keys: Array<string | null>;
  prefix: string;
  onKey: (key: string) => void;
  compact?: boolean;
}

/**
 * Shared grid-based keyboard layout component
 * Renders a 3-column grid of keys with empty cells for null values
 */
export function KeyGrid({ keys, prefix, onKey, compact = false }: KeyGridProps) {
  const keyClassName = compact
    ? 'glass-panel w-full rounded-2xl border border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/74 py-3 text-3xl font-bold text-(--hg-text) shadow-[0_10px_24px_var(--hg-shadow-depth)] transition-all duration-150 hover:border-[var(--hg-secondary)]/20 hover:bg-[var(--hg-white-overlay-subtle)] active:translate-y-px active:border-[var(--hg-secondary)]/34 active:bg-[var(--hg-secondary-strong)]/14 touch-manipulation'
    : 'glass-panel min-h-20 w-full rounded-2xl border border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/74 py-6 text-4xl font-bold text-(--hg-text) shadow-[0_10px_24px_var(--hg-shadow-depth)] transition-all duration-150 hover:border-[var(--hg-secondary)]/20 hover:bg-[var(--hg-white-overlay-subtle)] active:translate-y-px active:border-[var(--hg-secondary)]/34 active:bg-[var(--hg-secondary-strong)]/14 touch-manipulation';

  const gridClassName = compact
    ? 'grid h-full grid-cols-3 gap-2 w-full'
    : 'grid grid-cols-3 gap-3 w-full';

  return (
    <div className={gridClassName}>
      {keys.map((key, index) =>
        key ? (
          <button key={key} type="button" onClick={() => onKey(key)} className={keyClassName}>
            {key}
          </button>
        ) : (
          <div key={`${prefix}-empty-${index}`} aria-hidden="true" />
        )
      )}
    </div>
  );
}
