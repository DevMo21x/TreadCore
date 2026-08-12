'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  deleteCurrentUserAccountFormAction,
  type DeleteCurrentUserAccountFormState,
} from '@/lib/actions/user';
import { isUsernameCharacter } from '@/lib/users/usernameValidation';
import { useWorkoutStore } from '@/stores';

import { KeyboardContainer } from '../keyboard/KeyboardContainer';

const DELETE_ACCOUNT_CALLBACK_URL = '/login';
const initialDeleteCurrentUserAccountFormState: DeleteCurrentUserAccountFormState = {
  status: 'idle',
  message: '',
};

const CARD_CLASSES =
  'rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] shadow-lg backdrop-blur-sm';

export function DeleteAccountSection({ username }: Readonly<{ username: string }>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [draftUsername, setDraftUsername] = useState('');
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleReveal() {
    setDraftUsername('');
    setIsConfirming(true);
  }

  function handleCancel() {
    setIsConfirming(false);
    setFormKey((currentKey) => currentKey + 1);
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

  if (isConfirming) {
    return (
      <div className="flex h-full gap-4">
        <section className={`flex flex-1 flex-col max-h-[640px] p-5 ${CARD_CLASSES}`}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-tertiary)]">
              Danger Zone
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Delete Account</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
              Permanently remove your profile, workout history, and any progress tied to this
              account. This action cannot be undone.
            </p>
          </div>

          <DeleteAccountConfirmationForm
            key={formKey}
            formRef={formRef}
            username={username}
            draftUsername={draftUsername}
            onPendingChange={setIsPending}
            onCancel={handleCancel}
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
    <section className={`flex flex-col p-8 ${CARD_CLASSES}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-tertiary)]">
            Danger Zone
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--hg-text)]">Delete Account</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--hg-muted)]">
            Permanently remove your profile, workout history, and any progress tied to this account.
            This action cannot be undone.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReveal}
          className="inline-flex items-center justify-center rounded-full bg-[var(--hg-tertiary)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--hg-tertiary-strong)]"
        >
          Delete Account
        </button>
      </div>
    </section>
  );
}

function DeleteAccountConfirmationForm({
  formRef,
  username,
  draftUsername,
  onPendingChange,
  onCancel,
}: Readonly<{
  formRef: React.RefObject<HTMLFormElement | null>;
  username: string;
  draftUsername: string;
  onPendingChange: (pending: boolean) => void;
  onCancel: () => void;
}>) {
  const [state, formAction, pending] = useActionState(
    deleteCurrentUserAccountFormAction,
    initialDeleteCurrentUserAccountFormState
  );
  const hasSignedOutRef = useRef(false);
  const isLocked = pending || state.status === 'success';

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  useEffect(() => {
    if (state.status !== 'success' || hasSignedOutRef.current) {
      return;
    }

    hasSignedOutRef.current = true;
    useWorkoutStore.getState().reset();
    void signOut({ callbackUrl: DELETE_ACCOUNT_CALLBACK_URL });
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      data-testid="delete-account-confirmation-form"
      className="mt-4 flex-1 rounded-3xl border border-red-200 bg-red-50 p-5"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-700">
          Type <span className="font-semibold text-slate-900">{username}</span> to confirm this
          permanent deletion.
        </p>

        <div>
          <label
            htmlFor="delete-account-username"
            className="block text-sm font-medium text-slate-900"
          >
            Confirm Username
          </label>
          <input
            id="delete-account-username"
            type="text"
            value={draftUsername}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="none"
            readOnly
            placeholder={username}
            className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-red-400"
          />
          <input type="hidden" name="username" value={draftUsername} />
        </div>

        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === 'error'
                ? 'rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700'
                : 'rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700'
            }
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLocked}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLocked}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending
              ? 'Deleting Account...'
              : state.status === 'success'
                ? 'Redirecting...'
                : 'Delete My Account'}
          </button>
        </div>
      </div>
    </form>
  );
}
