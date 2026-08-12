'use client';

import { useState } from 'react';
import { ChangePinSection } from '@/components/profile/ChangePinSection';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { EditProfileMetricsSection } from '@/components/profile/EditProfileMetricsSection';
import { EditUsernameSection } from '@/components/profile/EditUsernameSection';

type ActiveSection = 'username' | 'metrics' | 'pin' | 'delete' | null;

const numberFormatter = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

function formatWeight(w: number | null) {
  return w !== null ? `${numberFormatter.format(w)} kg` : 'Not set';
}

function formatAge(a: number | null) {
  return a !== null ? `${a} yrs` : 'Not set';
}

export function SettingsGrid({
  username,
  weightKg,
  ageYears,
}: Readonly<{
  username: string;
  weightKg: number | null;
  ageYears: number | null;
}>) {
  const [active, setActive] = useState<ActiveSection>(null);
  const [localUsername, setLocalUsername] = useState(username);
  const [localWeightKg, setLocalWeightKg] = useState(weightKg);
  const [localAgeYears, setLocalAgeYears] = useState(ageYears);

  function handleUsernameUpdated(updatedUsername: string) {
    setLocalUsername(updatedUsername);
  }

  function handleMetricsUpdated(updatedWeightKg: number | null, updatedAgeYears: number | null) {
    setLocalWeightKg(updatedWeightKg);
    setLocalAgeYears(updatedAgeYears);
  }

  if (active !== null) {
    return (
      <div className="flex h-[calc(100vh-161px)] flex-col">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="mb-3 inline-flex items-center gap-2 self-start rounded-full border border-[color:var(--hg-separator)] px-5 py-2 text-base font-semibold text-[var(--hg-text)] transition-colors hover:border-[color:var(--hg-divider)] hover:bg-[color:var(--hg-interactive-muted)]"
        >
          ← Back to Settings
        </button>
        <div className="min-h-0 flex-1">
          {active === 'username' && (
            <EditUsernameSection
              username={localUsername}
              onUsernameUpdated={handleUsernameUpdated}
            />
          )}
          {active === 'metrics' && (
            <EditProfileMetricsSection
              weightKg={localWeightKg}
              ageYears={localAgeYears}
              onMetricsUpdated={handleMetricsUpdated}
            />
          )}
          {active === 'pin' && <ChangePinSection />}
          {active === 'delete' && <DeleteAccountSection username={localUsername} />}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div className="rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-6 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
          Account
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--hg-text)]">Username</h2>
        <p className="mt-3 text-lg text-[var(--hg-text)]">{localUsername}</p>
        <button
          type="button"
          onClick={() => setActive('username')}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--hg-primary-strong)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[rgba(125,60,255,0.8)] active:bg-[rgba(125,60,255,0.6)] touch-manipulation"
        >
          Edit
        </button>
      </div>

      <div className="rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-6 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
          Personal
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--hg-text)]">Weight & Age</h2>
        <p className="mt-3 text-lg text-[var(--hg-muted)]">
          {formatWeight(localWeightKg)} · {formatAge(localAgeYears)}
        </p>
        <button
          type="button"
          onClick={() => setActive('metrics')}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--hg-primary-strong)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[rgba(125,60,255,0.8)] active:bg-[rgba(125,60,255,0.6)] touch-manipulation"
        >
          Edit
        </button>
      </div>

      <div className="rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-6 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
          Security
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--hg-text)]">PIN</h2>
        <p className="mt-3 text-lg text-[var(--hg-muted)]">Protected</p>
        <button
          type="button"
          onClick={() => setActive('pin')}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--hg-primary-strong)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[rgba(125,60,255,0.8)] active:bg-[rgba(125,60,255,0.6)] touch-manipulation"
        >
          Change
        </button>
      </div>

      <div className="rounded-3xl border border-[var(--hg-tertiary)]/30 bg-[var(--hg-surface-panel)] p-6 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-tertiary)]">
          Danger Zone
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--hg-text)]">Delete Account</h2>
        <p className="mt-3 text-lg text-[var(--hg-muted)]">Permanently remove your account</p>
        <button
          type="button"
          onClick={() => setActive('delete')}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--hg-tertiary)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--hg-tertiary-strong)] touch-manipulation"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
