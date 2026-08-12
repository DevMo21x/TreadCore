'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardContainer } from '@/components/keyboard/KeyboardContainer';
import { isPinCharacter } from '@/lib/users/pinValidation';
import { type UpdateCurrentPinFormState, updateCurrentPinFormAction } from '@/lib/actions/user';

const initialUpdateCurrentPinFormState: UpdateCurrentPinFormState = {
  status: 'idle',
  message: '',
};

type PinField = 'currentPin' | 'newPin' | 'confirmPin';

const CARD_CLASSES =
  'rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] shadow-lg backdrop-blur-sm';

export function ChangePinSection() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [activeField, setActiveField] = useState<PinField>('currentPin');
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleReveal() {
    setSuccessMessage('');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setActiveField('currentPin');
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setFormKey((k) => k + 1);
  }

  function handleSuccess(message: string) {
    setSuccessMessage(message);
    setIsEditing(false);
    setFormKey((k) => k + 1);
    router.refresh();
  }

  function updateFieldValue(field: PinField, updater: (value: string) => string) {
    switch (field) {
      case 'currentPin':
        setCurrentPin(updater);
        return;
      case 'newPin':
        setNewPin(updater);
        return;
      case 'confirmPin':
        setConfirmPin(updater);
        return;
    }
  }

  function handleKey(key: string) {
    if (!isPinCharacter(key) || isPending) return;
    updateFieldValue(activeField, (value) => value + key);
  }

  function handleBackspace() {
    if (isPending) return;
    updateFieldValue(activeField, (value) => value.slice(0, -1));
  }

  function handleEnter() {
    if (isPending) return;

    if (activeField === 'currentPin') {
      setActiveField('newPin');
      return;
    }

    if (activeField === 'newPin') {
      setActiveField('confirmPin');
      return;
    }

    formRef.current?.requestSubmit();
  }

  function handlePhysicalKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      handleBackspace();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleEnter();
      return;
    }

    if (event.key.length === 1 && isPinCharacter(event.key)) {
      event.preventDefault();
      handleKey(event.key);
    }
  }

  if (isEditing) {
    return (
      <div className="flex h-full gap-4">
        <section className={`flex flex-1 flex-col p-5 max-h-[640px] ${CARD_CLASSES}`}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
              Security
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Change PIN</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
              Verify your current PIN, then choose a new one. Use the keypad or your physical
              keyboard to enter a 4-32 digit PIN.
            </p>
          </div>

          <div className="mt-4 rounded-3xl border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-interactive-soft)] p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-[var(--hg-muted)]">PIN Status</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
              Protected
            </p>
          </div>

          <ChangePinForm
            key={formKey}
            formRef={formRef}
            currentPin={currentPin}
            newPin={newPin}
            confirmPin={confirmPin}
            activeField={activeField}
            onFocusCurrentPin={() => setActiveField('currentPin')}
            onFocusNewPin={() => setActiveField('newPin')}
            onFocusConfirmPin={() => setActiveField('confirmPin')}
            onKeyDown={handlePhysicalKeydown}
            onPendingChange={setIsPending}
            onSuccess={handleSuccess}
          />
        </section>

        <div className={`w-[640px] h-[640px] shrink-0 p-4 ${CARD_CLASSES}`}>
          <KeyboardContainer
            mode="pin"
            onKey={handleKey}
            onBackspace={handleBackspace}
            onCancel={handleCancel}
            onEnter={handleEnter}
            disabled={isPending}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <section className={`flex flex-col p-5 ${CARD_CLASSES}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
            Security
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Change PIN</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
            Verify your current PIN, then choose a new one. Use the keypad to enter a 4-32 digit
            PIN.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReveal}
          className="inline-flex items-center justify-center rounded-full bg-[var(--hg-primary-strong)] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[rgba(125,60,255,0.8)] active:bg-[rgba(125,60,255,0.6)] touch-manipulation"
        >
          Change PIN
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-interactive-soft)] p-4 backdrop-blur-sm">
        <p className="text-sm font-medium text-[var(--hg-muted)]">PIN Status</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
          Protected
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--hg-muted)]">
          Your PIN is stored securely and never shown in plain text.
        </p>

        {successMessage ? (
          <p className="mt-3 rounded-2xl border border-[color:var(--hg-success-border)] bg-[color:var(--hg-success-bg)] px-4 py-2 text-sm font-medium text-[color:var(--hg-success-text)]">
            {successMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ChangePinForm({
  formRef,
  currentPin,
  newPin,
  confirmPin,
  activeField,
  onFocusCurrentPin,
  onFocusNewPin,
  onFocusConfirmPin,
  onKeyDown,
  onPendingChange,
  onSuccess,
}: Readonly<{
  formRef: React.RefObject<HTMLFormElement | null>;
  currentPin: string;
  newPin: string;
  confirmPin: string;
  activeField: PinField;
  onFocusCurrentPin: () => void;
  onFocusNewPin: () => void;
  onFocusConfirmPin: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: (message: string) => void;
}>) {
  const [state, formAction, pending] = useActionState(
    updateCurrentPinFormAction,
    initialUpdateCurrentPinFormState
  );
  const handledSuccessRef = useRef(false);

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  useEffect(() => {
    if (state.status !== 'success' || handledSuccessRef.current) return;
    handledSuccessRef.current = true;
    onSuccess(state.message);
  }, [onSuccess, state.message, state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex-1 rounded-3xl border border-slate-200 bg-white p-5"
    >
      <div className="space-y-4">
        <PinInputField
          id="current-pin-input"
          label="Current PIN"
          name="currentPin"
          value={currentPin}
          isActive={activeField === 'currentPin'}
          onFocus={onFocusCurrentPin}
          onKeyDown={onKeyDown}
        />
        <PinInputField
          id="new-pin-input"
          label="New PIN"
          name="newPin"
          value={newPin}
          isActive={activeField === 'newPin'}
          onFocus={onFocusNewPin}
          onKeyDown={onKeyDown}
        />
        <PinInputField
          id="confirm-pin-input"
          label="Confirm New PIN"
          name="confirmPin"
          value={confirmPin}
          isActive={activeField === 'confirmPin'}
          onFocus={onFocusConfirmPin}
          onKeyDown={onKeyDown}
        />

        <p className="text-sm text-slate-500">
          Press Enter to move to the next field. The final Enter submits the form.
        </p>

        {state.status === 'error' ? (
          <p
            aria-live="polite"
            className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function PinInputField({
  id,
  isActive,
  label,
  name,
  onFocus,
  onKeyDown,
  value,
}: Readonly<{
  id: string;
  isActive: boolean;
  label: string;
  name: string;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  value: string;
}>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        id={id}
        type="password"
        name={name}
        value={value}
        readOnly
        inputMode="none"
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 ${
          isActive ? 'border-slate-500 ring-2 ring-slate-200' : 'border-slate-200'
        }`}
      />
    </div>
  );
}
