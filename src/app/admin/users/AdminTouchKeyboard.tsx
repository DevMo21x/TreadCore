'use client';

import { useState } from 'react';

type AdminTouchKeyboardMode = 'pin' | 'username';

type AdminTouchKeyboardProps = {
  mode: AdminTouchKeyboardMode;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onCancel: () => void;
  onEnter: () => void;
  disabled?: boolean;
};

const PIN_ROWS: Array<Array<string | null>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', null],
];

const USERNAME_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z'],
] as const;

function AdminKeyboardKey({
  disabled = false,
  label,
  onClick,
}: Readonly<{
  disabled?: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-(--hg-text) min-h-20 w-full rounded-2xl border border-white/10 bg-[rgba(19,19,19,0.72)] py-6 text-4xl font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm transition hover:border-(--hg-secondary) hover:bg-[rgba(0,227,253,0.12)] active:bg-[rgba(0,227,253,0.18)] active:text-(--hg-secondary) touch-manipulation disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function AdminKeyboardActionButton({
  disabled = false,
  label,
  onClick,
  tone,
}: Readonly<{
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone: 'back' | 'cancel' | 'enter';
}>) {
  const toneClassName =
    tone === 'back'
      ? 'border-[rgba(208,188,255,0.35)] bg-[rgba(208,188,255,0.12)] text-(--hg-primary) hover:bg-[rgba(208,188,255,0.2)] active:bg-[rgba(208,188,255,0.28)]'
      : tone === 'cancel'
        ? 'border-[rgba(255,178,186,0.35)] bg-[rgba(255,178,186,0.12)] text-(--hg-tertiary) hover:bg-[rgba(255,178,186,0.2)] active:bg-[rgba(255,178,186,0.28)]'
        : 'border-[rgba(0,227,253,0.35)] bg-[rgba(0,227,253,0.12)] text-(--hg-secondary) hover:bg-[rgba(0,227,253,0.2)] active:bg-[rgba(0,227,253,0.28)]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-2xl border py-6 text-xl font-bold uppercase tracking-[0.12em] shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm transition touch-manipulation ${toneClassName} ${
        disabled ? 'cursor-not-allowed opacity-40' : ''
      }`}
    >
      {label}
    </button>
  );
}

export function AdminTouchKeyboard({
  mode,
  onKey,
  onBackspace,
  onCancel,
  onEnter,
  disabled = false,
}: Readonly<AdminTouchKeyboardProps>) {
  const [capsEnabled, setCapsEnabled] = useState(false);

  function handleUsernameKey(key: string) {
    onKey(capsEnabled ? key.toUpperCase() : key.toLowerCase());

    if (capsEnabled) {
      setCapsEnabled(false);
    }
  }

  return (
    <div className="glass-panel w-full space-y-4 rounded-[28px] border border-white/10 bg-[rgba(19,19,19,0.82)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
      {mode === 'pin' ? (
        <div className="flex flex-col gap-3">
          {PIN_ROWS.map((row) => (
            <div key={row.join('-')} className="grid grid-cols-3 gap-3 w-full">
              {row.map((key, index) =>
                key ? (
                  <AdminKeyboardKey
                    key={key}
                    disabled={disabled}
                    label={key}
                    onClick={() => onKey(key)}
                  />
                ) : (
                  <div key={`pin-empty-${row.join('-')}-${index}`} aria-hidden="true" />
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {USERNAME_ROWS.map((row) => (
            <div key={row[0]} className="flex gap-3 w-full">
              {row.map((key) => (
                <div key={key} className="flex-1 min-w-15">
                  <AdminKeyboardKey
                    disabled={disabled}
                    label={key.toUpperCase()}
                    onClick={() => handleUsernameKey(key)}
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="flex w-full">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setCapsEnabled((currentValue) => !currentValue)}
              className={`flex-1 rounded-2xl border py-5 text-2xl font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm transition touch-manipulation ${
                capsEnabled
                  ? 'border-[rgba(208,188,255,0.35)] bg-[rgba(208,188,255,0.16)] text-(--hg-primary) hover:bg-[rgba(208,188,255,0.22)]'
                  : 'border-white/10 bg-[rgba(19,19,19,0.72)] text-(--hg-text) hover:border-(--hg-primary) hover:bg-[rgba(208,188,255,0.12)] hover:text-(--hg-primary)'
              } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              ⇪ {capsEnabled ? 'SHIFT ON' : 'SHIFT'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <AdminKeyboardActionButton
          disabled={disabled}
          label="← Back"
          onClick={onBackspace}
          tone="back"
        />
        <AdminKeyboardActionButton
          disabled={disabled}
          label="Cancel"
          onClick={onCancel}
          tone="cancel"
        />
        <AdminKeyboardActionButton
          disabled={disabled}
          label="Enter"
          onClick={onEnter}
          tone="enter"
        />
      </div>
    </div>
  );
}
