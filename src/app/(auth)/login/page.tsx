'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { KeyboardContainer } from '@/components/keyboard/KeyboardContainer';
import { UserSelectionPanel } from '@/components/UserSelectionPanel';
import { isPinCharacter } from '@/lib/users/pinValidation';
import { isUsernameCharacter } from '@/lib/users/usernameValidation';
const DEFAULT_THROTTLE_STATUS = {
  locked: false,
  retryAfterSeconds: 0,
  remainingAttempts: 5,
};

type Stage = 'username' | 'pin';
type LoginThrottleStatus = {
  locked: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
};

function formatRetryAfter(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

async function fetchThrottleStatus(username: string): Promise<LoginThrottleStatus> {
  const response = await fetch(`/api/auth/throttle?username=${encodeURIComponent(username)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return DEFAULT_THROTTLE_STATUS;
  }

  return (await response.json()) as LoginThrottleStatus;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get('user') ?? '';
  const [, setAvailableUsers] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>(preselect ? 'pin' : 'username');
  const [username, setUsername] = useState(preselect);
  const [pin, setPin] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'pin' | null>(
    preselect ? 'pin' : 'username'
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (retryAfterSeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRetryAfterSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [retryAfterSeconds]);

  function selectUser(selected: string) {
    setUsername(selected);
    setStage('pin');
    setActiveField('pin');
  }

  function resetToUsernameSelection() {
    setStage('username');
    setPin('');
    setActiveField('username');
    setError('');
    setRetryAfterSeconds(0);
  }

  function handleKey(key: string) {
    if (activeField === 'username' && isUsernameCharacter(key)) {
      setUsername((prev) => prev + key);
    }
    if (activeField === 'pin') {
      if (error && retryAfterSeconds === 0) setError('');
      setPin((prev) => prev + key);
    }
  }

  function handleBackspace() {
    if (activeField === 'username') {
      setUsername((prev) => prev.slice(0, -1));
    }
    if (activeField === 'pin') {
      setPin((prev) => prev.slice(0, -1));
    }
  }

  function handlePhysicalKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!activeField) return;
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
      } else if (activeField === 'pin' && isPinCharacter(e.key)) {
        handleKey(e.key);
      }
    }
  }

  async function handleEnter() {
    if (stage === 'username') {
      if (username.trim().length > 0) {
        selectUser(username.trim().toLowerCase());
      }
      return;
    }
    if (username && pin) {
      setIsLoading(true);
      setError('');
      try {
        const throttleStatus = await fetchThrottleStatus(username);

        if (throttleStatus.locked) {
          setRetryAfterSeconds(throttleStatus.retryAfterSeconds);
          setPin('');
          return;
        }

        const result = await signIn('credentials', { username, pin, redirect: false });

        if (result?.ok && !result?.error) {
          setRetryAfterSeconds(0);
          router.push('/dashboard');
        } else {
          const updatedThrottleStatus = await fetchThrottleStatus(username);

          if (updatedThrottleStatus.locked) {
            setRetryAfterSeconds(updatedThrottleStatus.retryAfterSeconds);
            setError('');
          } else {
            setRetryAfterSeconds(0);
            setError('Invalid PIN');
          }

          setPin('');
        }
      } catch (err) {
        setRetryAfterSeconds(0);
        setError('Unable to sign in right now. Please try again.');
        setPin('');
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handleCancel() {
    if (stage === 'username') {
      setUsername('');
      router.push('/');
    } else if (stage === 'pin') {
      resetToUsernameSelection();
    } else {
      setActiveField(null);
    }
  }

  const visibleError =
    retryAfterSeconds > 0
      ? `Too many attempts. Try again in ${formatRetryAfter(retryAfterSeconds)}.`
      : error;
  const fieldLabelClassName =
    'text-[11px] font-bold uppercase tracking-[0.24em] text-[color:var(--hg-muted)]';
  const fieldHintClassName = 'mt-2 text-sm leading-6 text-[color:var(--hg-muted)]';
  const baseInputClassName =
    'mt-2 w-full rounded-3xl border px-4 py-4 text-xl tracking-[0.02em] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-150';
  const usernameInputClassName = `${baseInputClassName} ${
    stage === 'pin'
      ? 'cursor-not-allowed border-white/10 bg-[color:var(--hg-surface-high)] text-[color:var(--hg-muted)]'
      : activeField === 'username'
        ? 'border-[rgba(189,244,255,0.4)] bg-[rgba(19,19,19,0.92)] text-[color:var(--hg-text)] shadow-[0_0_0_1px_rgba(189,244,255,0.1)]'
        : 'border-white/10 bg-[rgba(19,19,19,0.88)] text-[color:var(--hg-text)]'
  }`;
  const pinInputClassName = `${baseInputClassName} ${
    activeField === 'pin'
      ? 'border-[rgba(208,188,255,0.42)] bg-[rgba(19,19,19,0.92)] text-[color:var(--hg-text)] shadow-[0_0_0_1px_rgba(208,188,255,0.12)]'
      : 'border-white/10 bg-[rgba(19,19,19,0.88)] text-[color:var(--hg-text)]'
  }`;

  return (
    <div className="hyper-grid-theme relative min-h-screen overflow-hidden font-hyper-grid text-(--hg-text)">
      <div aria-hidden="true" className="hyper-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-430 items-center px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <section className="glass-panel relative overflow-hidden rounded-4xl border-white/15 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.36)] sm:px-8 sm:py-10 lg:min-h-190 lg:px-10 lg:py-12">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--hg-secondary) to-transparent opacity-80"
            />
            <div
              aria-hidden="true"
              className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(125,60,255,0.28)_0%,transparent_68%)]"
            />
            <div
              aria-hidden="true"
              className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,227,253,0.18)_0%,transparent_72%)]"
            />

            <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col justify-center gap-8">
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-(--hg-text) sm:text-5xl">
                  Sign In
                </h1>
              </div>

              <div className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="username" className={fieldLabelClassName}>
                      Username
                    </label>
                    <input
                      id="username"
                      value={username}
                      onFocus={() => stage === 'username' && setActiveField('username')}
                      onKeyDown={handlePhysicalKeydown}
                      readOnly
                      disabled
                      type="text"
                      inputMode="none"
                      className={usernameInputClassName}
                    />
                  </div>

                  {stage === 'pin' && (
                    <div>
                      <label htmlFor="pin" className={fieldLabelClassName}>
                        PIN
                      </label>
                      <input
                        id="pin"
                        value={pin}
                        onFocus={() => setActiveField('pin')}
                        onKeyDown={handlePhysicalKeydown}
                        readOnly
                        disabled
                        inputMode="none"
                        type="password"
                        className={pinInputClassName}
                      />
                      {visibleError ? (
                        <p className="mt-3 text-sm font-semibold text-(--hg-tertiary)">
                          {visibleError}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {activeField ? (
                  <KeyboardContainer
                    mode={activeField}
                    onKey={handleKey}
                    onBackspace={handleBackspace}
                    onCancel={handleCancel}
                    onEnter={handleEnter}
                    disabled={isLoading}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <UserSelectionPanel
            stage={stage}
            username={username}
            onSelectUser={selectUser}
            onSwitchUser={resetToUsernameSelection}
            onUsersLoaded={setAvailableUsers}
            className="w-full min-w-0 self-stretch"
          />
        </div>
      </div>
    </div>
  );
}
