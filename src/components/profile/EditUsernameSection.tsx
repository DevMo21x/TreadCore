'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardContainer } from '@/components/keyboard/KeyboardContainer';
import {
  type UpdateCurrentUsernameFormState,
  updateCurrentUsernameFormAction,
} from '@/lib/actions/user';
import { isUsernameCharacter } from '@/lib/users/usernameValidation';

const initialUpdateCurrentUsernameFormState: UpdateCurrentUsernameFormState = {
  status: 'idle',
  message: '',
};

const CARD_CLASSES =
  'rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] shadow-lg backdrop-blur-sm';

export function EditUsernameSection({
  username,
  onUsernameUpdated,
}: Readonly<{
  username: string;
  onUsernameUpdated?: (updatedUsername: string) => void;
}>) {
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState(username);
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [draftUsername, setDraftUsername] = useState(username);
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => setCurrentUsername(username));
  }, [username]);

  function handleReveal() {
    setSuccessMessage('');
    setDraftUsername(currentUsername);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setFormKey((k) => k + 1);
  }

  function handleSuccess(updatedUsername: string, message: string) {
    setCurrentUsername(updatedUsername);
    setSuccessMessage(message);
    setIsEditing(false);
    setFormKey((k) => k + 1);
    onUsernameUpdated?.(updatedUsername);
    router.refresh();
  }

  function handleKey(key: string) {
    if (!isUsernameCharacter(key) || isPending) return;
    setDraftUsername((prev) => prev + key);
  }

  function handleBackspace() {
    if (isPending) return;
    setDraftUsername((prev) => prev.slice(0, -1));
  }

  function handleEnter() {
    if (isPending) return;
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
    if (event.key.length === 1 && isUsernameCharacter(event.key)) {
      event.preventDefault();
      handleKey(event.key);
    }
  }

  if (isEditing) {
    return (
      <div className="flex h-full gap-4">
        <section className={`flex flex-1 flex-col max-h-[640px] p-5 ${CARD_CLASSES}`}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
              Account Settings
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Edit Username</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
              Update the username shown on your profile and used across the app. Usernames must be
              unique.
            </p>
          </div>

          <div className="mt-4 rounded-3xl border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-interactive-soft)] p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-[var(--hg-muted)]">Current Username</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
              {currentUsername}
            </p>
          </div>

          <EditUsernameForm
            key={formKey}
            formRef={formRef}
            draftUsername={draftUsername}
            onKeyDown={handlePhysicalKeydown}
            onPendingChange={setIsPending}
            onSuccess={handleSuccess}
          />
        </section>

        <div className={`w-[640px] h-[640px] shrink-0 p-4 ${CARD_CLASSES}`}>
          <KeyboardContainer
            mode="username"
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
            Account Settings
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Edit Username</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
            Update the username shown on your profile and used across the app. Usernames must be
            unique.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReveal}
          className="inline-flex items-center justify-center rounded-full bg-[var(--hg-primary-strong)] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[rgba(125,60,255,0.8)] active:bg-[rgba(125,60,255,0.6)] touch-manipulation"
        >
          Edit Username
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-interactive-soft)] p-4 backdrop-blur-sm">
        <p className="text-sm font-medium text-[var(--hg-muted)]">Current Username</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
          {currentUsername}
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

function EditUsernameForm({
  formRef,
  draftUsername,
  onKeyDown,
  onPendingChange,
  onSuccess,
}: Readonly<{
  formRef: React.RefObject<HTMLFormElement | null>;
  draftUsername: string;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: (updatedUsername: string, message: string) => void;
}>) {
  const [state, formAction, pending] = useActionState(
    updateCurrentUsernameFormAction,
    initialUpdateCurrentUsernameFormState
  );
  const handledSuccessRef = useRef(false);

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  useEffect(() => {
    if (state.status !== 'success' || !state.updatedUsername || handledSuccessRef.current) {
      return;
    }
    handledSuccessRef.current = true;
    onSuccess(state.updatedUsername, state.message);
  }, [onSuccess, state.message, state.status, state.updatedUsername]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex-1 rounded-3xl border border-slate-200 bg-white p-5"
    >
      <label htmlFor="edit-username-input" className="block text-sm font-medium text-slate-900">
        New Username
      </label>
      <input
        id="edit-username-input"
        type="text"
        value={draftUsername}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="none"
        readOnly
        onKeyDown={onKeyDown}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
      />
      <input type="hidden" name="username" value={draftUsername} />
      <p className="mt-2 text-sm text-slate-500">3-30 characters.</p>

      {state.status === 'error' ? (
        <p
          aria-live="polite"
          className="mt-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
