import { UsernameKeys } from './UsernameKeys';
import { PinKeys } from './PinKeys';
import { NumberKeys } from './NumberKeys';

type KeyboardMode = 'username' | 'pin' | 'number';

interface KeyboardContainerProps {
  mode: KeyboardMode;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onCancel: () => void;
  onEnter: () => void;
  disabled?: boolean;
  compact?: boolean;
}

function getActionButtonClassName(
  variant: 'back' | 'cancel' | 'enter',
  disabled: boolean,
  compact: boolean
) {
  const sharedClassName = compact
    ? 'flex-1 rounded-2xl py-3 text-lg font-bold transition-all duration-150 touch-manipulation'
    : 'flex-1 rounded-2xl py-6 text-2xl font-bold transition-all duration-150 touch-manipulation';

  const variantClassName = {
    back: 'border border-[var(--hg-secondary)]/35 bg-[var(--hg-secondary-strong)]/12 text-(--hg-secondary) hover:bg-[var(--hg-secondary-strong)]/18 active:translate-y-px active:bg-[var(--hg-secondary-strong)]/24 active:shadow-[0_10px_24px_var(--hg-shadow-depth)]',
    cancel:
      'border border-[var(--hg-tertiary)]/38 bg-[var(--hg-tertiary-strong)]/18 text-(--hg-text) hover:bg-[var(--hg-tertiary-strong)]/24 active:translate-y-px active:bg-[var(--hg-tertiary-strong)]/32 active:shadow-[0_10px_24px_var(--hg-shadow-depth)]',
    enter:
      'border border-[var(--hg-primary)]/42 bg-[var(--hg-primary-strong)]/38 text-(--hg-text) hover:bg-[var(--hg-primary-strong)]/44 active:translate-y-px active:bg-[var(--hg-primary-strong)]/48 active:shadow-[0_10px_24px_var(--hg-shadow-depth)]',
  }[variant];

  return `${sharedClassName} ${variantClassName} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`;
}

export function KeyboardContainer({
  mode,
  onKey,
  onBackspace,
  onCancel,
  onEnter,
  disabled = false,
  compact = false,
}: KeyboardContainerProps) {
  const containerClassName = compact
    ? 'glass-panel flex h-full w-full flex-col gap-3 rounded-[28px] border border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/82 p-3 shadow-[0_18px_48px_var(--hg-shadow-depth)]'
    : 'glass-panel w-full space-y-4 rounded-[28px] border border-[var(--hg-border-soft)] bg-[var(--hg-surface)]/82 p-4 shadow-[0_18px_48px_var(--hg-shadow-depth)]';

  return (
    <div className={containerClassName} data-testid="keyboard-container">
      {compact ? (
        <div className="min-h-0 flex-1">
          {mode === 'username' ? <UsernameKeys onKey={onKey} compact /> : null}
          {mode === 'pin' ? <PinKeys onKey={onKey} compact /> : null}
          {mode === 'number' ? <NumberKeys onKey={onKey} compact /> : null}
        </div>
      ) : (
        <>
          {mode === 'username' ? <UsernameKeys onKey={onKey} /> : null}
          {mode === 'pin' ? <PinKeys onKey={onKey} /> : null}
          {mode === 'number' ? <NumberKeys onKey={onKey} /> : null}
        </>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackspace}
          disabled={disabled}
          className={getActionButtonClassName('back', disabled, compact)}
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className={getActionButtonClassName('cancel', disabled, compact)}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onEnter}
          disabled={disabled}
          className={getActionButtonClassName('enter', disabled, compact)}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
