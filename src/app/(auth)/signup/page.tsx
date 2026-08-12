'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyboardContainer } from '@/components/keyboard/KeyboardContainer';
import { isPinCharacter } from '@/lib/users/pinValidation';
import { isUsernameCharacter } from '@/lib/users/usernameValidation';
import { createUser, discardCurrentGuestAccount } from '@/lib/actions/user';
import { useWorkoutStore } from '@/stores';

type Stage = 'username' | 'pin' | 'confirm';

function getStageCardClassName(currentStage: Stage, cardStage: Stage) {
  if (currentStage === cardStage) {
    return 'glass-panel rounded-[28px] border border-[color:var(--hg-secondary)] bg-[color:var(--hg-secondary-tint)] px-5 py-5 shadow-[0_18px_40px_var(--hg-shadow-depth)]';
  }

  return 'rounded-[28px] border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-surface-high)] px-5 py-5';
}

function getStageLabelClassName(currentStage: Stage, cardStage: Stage) {
  return currentStage === cardStage
    ? 'text-[11px] font-bold tracking-[0.24em] text-(--hg-primary)'
    : 'text-[11px] font-bold tracking-[0.24em] text-[color:var(--hg-muted)]';
}

function getStageTitleClassName(currentStage: Stage, cardStage: Stage) {
  return currentStage === cardStage
    ? 'mt-3 text-xl font-semibold tracking-[-0.03em] text-(--hg-text)'
    : 'mt-3 text-xl font-semibold tracking-[-0.03em] text-[color:var(--hg-muted)]';
}

export default function SignupPage() {
  const [stage, setStage] = useState<Stage>('username');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'pin' | 'confirm' | null>('username');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancellingGuest, setIsCancellingGuest] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuestPromotionIntent = searchParams.get('guest') === 'promote';
  const isBusy = isSubmitting || isCancellingGuest;
  const fieldLabelClassName =
    'text-[11px] font-bold uppercase tracking-[0.24em] text-[color:var(--hg-muted)]';
  const fieldHintClassName = 'mt-2 text-sm leading-6 text-[color:var(--hg-muted)] opacity-75';
  const baseInputClassName =
    'mt-2 w-full rounded-3xl border px-4 py-4 text-xl tracking-[0.02em] shadow-[inset_0_1px_0_var(--hg-white-overlay-subtle)] transition-all duration-150';
  const usernameInputClassName = `${baseInputClassName} ${
    stage !== 'username'
      ? 'cursor-not-allowed border-[color:var(--hg-border-soft)] bg-[color:var(--hg-surface-high)] text-[color:var(--hg-muted)]'
      : activeField === 'username'
        ? 'border-[color:var(--hg-secondary)] bg-[color:var(--hg-surface)] text-[color:var(--hg-text)] ring-1 ring-[color:var(--hg-secondary-focus-ring)]'
        : 'border-[color:var(--hg-border-soft)] bg-[color:var(--hg-surface)] text-[color:var(--hg-text)]'
  }`;
  const pinInputClassName = `${baseInputClassName} ${
    stage !== 'pin'
      ? 'cursor-not-allowed border-[color:var(--hg-border-soft)] bg-[color:var(--hg-surface-high)] text-[color:var(--hg-muted)]'
      : activeField === 'pin'
        ? 'border-[color:var(--hg-primary)] bg-[color:var(--hg-surface)] text-[color:var(--hg-text)] ring-1 ring-[color:var(--hg-primary-focus-ring)]'
        : 'border-[color:var(--hg-border-soft)] bg-[color:var(--hg-surface)] text-[color:var(--hg-text)]'
  }`;
  const confirmInputClassName = `${baseInputClassName} ${
    activeField === 'confirm'
      ? 'border-[color:var(--hg-secondary)] bg-[color:var(--hg-surface)] text-[color:var(--hg-text)] ring-1 ring-[color:var(--hg-secondary-focus-ring)]'
      : 'border-[color:var(--hg-border-soft)] bg-[color:var(--hg-surface-high)] text-[color:var(--hg-text)]'
  }`;

  function handleKey(key: string) {
    if (activeField === 'username' && isUsernameCharacter(key)) {
      setUsername((prev) => prev + key);
    }
    if (activeField === 'pin') {
      setPin((prev) => prev + key);
    }
    if (activeField === 'confirm') {
      setPinConfirm((prev) => prev + key);
    }
  }

  function handleBackspace() {
    if (activeField === 'username') {
      setUsername((prev) => prev.slice(0, -1));
    }
    if (activeField === 'pin') {
      setPin((prev) => prev.slice(0, -1));
    }
    if (activeField === 'confirm') {
      setPinConfirm((prev) => prev.slice(0, -1));
    }
  }

  function handlePhysicalKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!activeField || isBusy) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEnter();
    } else if (e.key.length === 1) {
      e.preventDefault();
      if (activeField === 'username' && isUsernameCharacter(e.key)) {
        handleKey(e.key);
      } else if ((activeField === 'pin' || activeField === 'confirm') && isPinCharacter(e.key)) {
        handleKey(e.key);
      }
    }
  }

  async function handleEnter() {
    if (isBusy) {
      return;
    }

    switch (stage) {
      case 'username':
        if (username.length >= 3) {
          setStage('pin');
          setActiveField('pin');
          setError('');
        } else {
          setError('Username must be at least 3 characters');
        }
        break;

      case 'pin':
        if (pin.length >= 4) {
          setStage('confirm');
          setActiveField('confirm');
          setError('');
        } else {
          setError('PIN must be at least 4 characters');
        }
        break;

      case 'confirm':
        if (pinConfirm !== pin) {
          setError('PINs do not match');
          return;
        }

        setIsSubmitting(true);
        try {
          await createUser({ username, pin });
          const result = await signIn('credentials', { username, pin, redirect: false });
          if (result?.ok) {
            router.push('/dashboard');
          } else {
            throw new Error('Something went wrong. Please try again later.');
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong. Please try again later.'
          );
          setIsSubmitting(false);
        }
        break;
    }
  }

  async function handleCancel() {
    if (isBusy) {
      return;
    }

    if (stage === 'username') {
      if (isGuestPromotionIntent) {
        setError('');
        setIsCancellingGuest(true);

        try {
          await discardCurrentGuestAccount();
          useWorkoutStore.getState().reset();
          await signOut({ callbackUrl: '/' });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong. Please try again later.'
          );
          setIsCancellingGuest(false);
        }

        return;
      }

      setUsername('');
      router.push('/');
    } else if (stage === 'pin') {
      setStage('username');
      setPin('');
      setActiveField('username');
    } else if (stage === 'confirm') {
      setStage('pin');
      setPinConfirm('');
      setActiveField('pin');
    } else {
      setActiveField(null);
    }
  }

  return (
    <div className="hyper-grid-theme relative min-h-screen overflow-hidden font-hyper-grid text-(--hg-text)">
      <div aria-hidden="true" className="hyper-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-430 items-center px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <section className="glass-panel relative overflow-hidden rounded-4xl border-[color:var(--hg-glass-border)] px-6 py-8 shadow-[0_24px_80px_var(--hg-shadow-hero)] sm:px-8 sm:py-10 lg:min-h-190 lg:px-10 lg:py-12">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--hg-secondary) to-transparent opacity-80"
            />
            <div
              aria-hidden="true"
              className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--hg-primary-glow)_0%,transparent_68%)]"
            />
            <div
              aria-hidden="true"
              className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,var(--hg-secondary-glow)_0%,transparent_72%)]"
            />

            <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col justify-center gap-8">
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-(--hg-text) sm:text-5xl">
                  Sign Up
                </h1>
              </div>

              {isGuestPromotionIntent ? (
                <div className="rounded-[28px] border border-[color:var(--hg-primary)] bg-[color:var(--hg-primary-tint)] px-5 py-4 text-sm leading-6 text-(--hg-text) shadow-[0_12px_32px_var(--hg-shadow-depth)]">
                  Finish creating an account to keep the progress from this guest session. If you
                  cancel from the first step, the guest session and its saved progress will be
                  deleted.
                </div>
              ) : null}

              <div className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="username" className={fieldLabelClassName}>
                      Create Username
                    </label>
                    <input
                      id="username"
                      value={username}
                      onFocus={() => stage === 'username' && setActiveField('username')}
                      onKeyDown={handlePhysicalKeydown}
                      readOnly
                      disabled
                      inputMode="none"
                      type="text"
                      className={usernameInputClassName}
                    />
                    <p className={fieldHintClassName}>3-30 characters</p>
                  </div>

                  {(stage === 'pin' || stage === 'confirm') && (
                    <div>
                      <label htmlFor="pin" className={fieldLabelClassName}>
                        Create PIN
                      </label>
                      <input
                        id="pin"
                        value={pin}
                        onFocus={() => stage === 'pin' && setActiveField('pin')}
                        onKeyDown={handlePhysicalKeydown}
                        readOnly
                        disabled
                        inputMode="none"
                        type="password"
                        className={pinInputClassName}
                      />
                      <p className={fieldHintClassName}>4-32 digits</p>
                    </div>
                  )}

                  {stage === 'confirm' && (
                    <div>
                      <label htmlFor="confirm" className={fieldLabelClassName}>
                        Confirm PIN
                      </label>
                      <input
                        id="confirm"
                        value={pinConfirm}
                        onFocus={() => setActiveField('confirm')}
                        onKeyDown={handlePhysicalKeydown}
                        readOnly
                        disabled
                        inputMode="none"
                        type="password"
                        className={confirmInputClassName}
                      />
                    </div>
                  )}

                  {error ? (
                    <p className="text-sm font-semibold text-(--hg-tertiary)">{error}</p>
                  ) : null}
                </div>

                {activeField ? (
                  <KeyboardContainer
                    mode={activeField === 'username' ? 'username' : 'pin'}
                    onKey={handleKey}
                    onBackspace={handleBackspace}
                    onCancel={() => {
                      void handleCancel();
                    }}
                    onEnter={handleEnter}
                    disabled={isBusy}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <aside className="glass-panel flex min-h-full flex-col rounded-4xl border-[color:var(--hg-glass-border)] px-6 py-8 shadow-[0_20px_56px_var(--hg-shadow-panel)] sm:px-7 lg:px-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-[0.3em] text-(--hg-secondary)">
                PROGRESS MATRIX
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-(--hg-text)">
                Progress
              </h2>
              <p className="text-sm leading-6 text-[color:var(--hg-muted)] opacity-80">
                Each stage locks in before the next one opens, so the registration flow stays clear
                even on the shared keyboard.
              </p>
            </div>

            <div className="mt-8 flex flex-1 flex-col gap-4">
              <div className={getStageCardClassName(stage, 'username')}>
                <p className={getStageLabelClassName(stage, 'username')}>STEP 01</p>
                <p className={getStageTitleClassName(stage, 'username')}>Username</p>
                <p className="mt-3 text-sm text-[color:var(--hg-muted)] opacity-80">
                  {username ? `@${username}` : 'Set the account handle'}
                </p>
              </div>

              <div className={getStageCardClassName(stage, 'pin')}>
                <p className={getStageLabelClassName(stage, 'pin')}>STEP 02</p>
                <p className={getStageTitleClassName(stage, 'pin')}>Create PIN</p>
                <p className="mt-3 text-sm tracking-[0.4em] text-(--hg-secondary)">
                  {pin ? '•'.repeat(pin.length) : 'READY'}
                </p>
              </div>

              <div className={getStageCardClassName(stage, 'confirm')}>
                <p className={getStageLabelClassName(stage, 'confirm')}>STEP 03</p>
                <p className={getStageTitleClassName(stage, 'confirm')}>Confirm PIN</p>
                <p className="mt-3 text-sm tracking-[0.4em] text-(--hg-secondary)">
                  {pinConfirm ? '•'.repeat(pinConfirm.length) : 'VERIFY'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
