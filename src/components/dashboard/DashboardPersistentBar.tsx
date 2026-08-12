'use client';

import { useState } from 'react';
import { CooldownButton } from '@/components/treadmill/CooldownButton';
import { InclineControl } from '@/components/treadmill/InclineControl';
import { PauseButton } from '@/components/treadmill/PauseButton';
import { SpeedControl } from '@/components/treadmill/SpeedControl';
import { StartTreadmillButton } from '@/components/treadmill/StartTreadmillButton';
import { StopTreadmillButton } from '@/components/treadmill/StopTreadmillButton';
import { useTreadmillStore, useWorkoutStore } from '@/stores';

function formatDuration(totalSeconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatPace(decimalMinutes: number): string {
  const totalSeconds = Math.round(decimalMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function SummaryCard({
  label,
  value,
  unit,
}: Readonly<{
  label: string;
  value: string;
  unit: string;
}>) {
  return (
    <div className="glass-panel flex-auto flex flex-row items-baseline justify-between rounded-xl py-1 px-3">
      <span className="text-xl font-bold tracking-widest text-[color:var(--hg-muted)]">
        {label}
      </span>
      <span className="text-2xl font-bold text-[color:var(--hg-muted)]">-</span>
      <div className="flex items-baseline gap-1">
        <div className="text-2xl font-bold tracking-[-0.04em] text-[color:var(--hg-text)]">
          {value}
        </div>
        <div className="text-lg font-bold tracking-widest text-[color:var(--hg-muted)]">{unit}</div>
      </div>
    </div>
  );
}

export function DashboardPersistentBar() {
  const speed = useTreadmillStore((state) => state.stableSpeed);
  const elapsedSeconds = useWorkoutStore((state) => state.elapsedSeconds);
  const distanceKm = useWorkoutStore((state) => state.distanceKm);
  const calories = useWorkoutStore((state) => state.calories);
  const elevationGainM = useWorkoutStore((state) => state.elevationGainM);
  const xpGained = useWorkoutStore((state) => state.xp);
  const startedAt = useWorkoutStore((state) => state.startedAt);
  const workoutStatus = useWorkoutStore((state) => state.status);
  const requestForfeit = useWorkoutStore((state) => state.requestForfeit);
  const [isForfeitDialogOpen, setIsForfeitDialogOpen] = useState(false);
  const [forfeitDialogSessionStart, setForfeitDialogSessionStart] = useState<number | null>(null);

  const emergencyActive = useTreadmillStore((state) => state.emergencyActive);
  const isTreadmillRunning = speed > 0;
  const isSessionActive = workoutStatus === 'running' || workoutStatus === 'paused';

  const avgPace =
    elapsedSeconds > 0 && distanceKm > 0 ? formatPace(elapsedSeconds / 60 / distanceKm) : '—';
  const currentPace = speed > 0 ? formatPace(60 / speed) : '—';

  const showForfeitDialog =
    isForfeitDialogOpen &&
    isSessionActive &&
    startedAt !== null &&
    forfeitDialogSessionStart === startedAt;

  const closeForfeitDialog = () => {
    setIsForfeitDialogOpen(false);
    setForfeitDialogSessionStart(null);
  };

  const handleConfirmForfeit = () => {
    requestForfeit();
    closeForfeitDialog();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-row gap-2 overflow-x-auto">
          <SummaryCard label="TIME" value={formatDuration(elapsedSeconds)} unit="" />
          <SummaryCard label="DISTANCE" value={distanceKm.toFixed(2)} unit="KM" />
          <SummaryCard label="CALORIES" value={calories.toFixed(1)} unit="" />
          <SummaryCard label="AVG PACE" value={avgPace} unit="/KM" />
          <SummaryCard label="CUR PACE" value={currentPace} unit="/KM" />
          <SummaryCard label="ELEVATION" value={elevationGainM.toFixed(1)} unit="M" />
          <SummaryCard label="XP" value={`${xpGained}`} unit="" />
        </div>

        {isSessionActive ? (
          <button
            type="button"
            onClick={() => {
              setForfeitDialogSessionStart(startedAt);
              setIsForfeitDialogOpen(true);
            }}
            className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-red-300/80 transition-colors hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-200"
            aria-label="Forfeit active session"
          >
            X END
          </button>
        ) : null}
      </div>

      <div className="glass-panel grid min-h-30 grid-cols-12 items-center gap-3 rounded-t-2xl border-t border-[color:var(--hg-divider)] p-3">
        <SpeedControl quickOptionsLayout="left" className="col-span-12 lg:col-span-5" />

        {emergencyActive ? (
          <div
            className="col-span-12 flex flex-col items-center justify-center gap-1 rounded-xl border border-(--hg-tertiary) bg-[rgba(255,46,99,0.08)] px-3 py-4 shadow-[0_0_24px_rgba(255,46,99,0.25)] lg:col-span-2"
            role="alert"
            aria-live="assertive"
          >
            <span className="text-center text-sm font-bold uppercase tracking-widest text-(--hg-tertiary)">
              Emergency stop active
            </span>
            <span className="text-center text-xs text-(--hg-muted)">
              Release the e-stop key to continue
            </span>
          </div>
        ) : (
          <div className="col-span-12 flex flex-col items-center justify-center gap-2 lg:col-span-2">
            <CooldownButton />
            <PauseButton />
            {isTreadmillRunning ? (
              <StopTreadmillButton label="STOP" loadingLabel="STOPPING" />
            ) : (
              <StartTreadmillButton label="START" loadingLabel="STARTING" />
            )}
          </div>
        )}

        <InclineControl quickOptionsLayout="right" className="col-span-12 lg:col-span-5" />
      </div>

      {showForfeitDialog ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/65 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close forfeit confirmation dialog"
            onClick={closeForfeitDialog}
            className="absolute inset-0 h-full w-full bg-transparent"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forfeit-session-title"
            aria-describedby="forfeit-session-description"
            className="relative z-10 w-full max-w-xl rounded-3xl border border-red-500/30 bg-[color:var(--hg-surface)] p-6 shadow-2xl"
          >
            <h2
              id="forfeit-session-title"
              className="text-xl font-semibold text-[color:var(--hg-text)]"
            >
              Discard this session?
            </h2>
            <p
              id="forfeit-session-description"
              className="mt-3 text-sm leading-6 text-[color:var(--hg-muted)]"
            >
              This session will not be saved. Your progress, distance and calories will be
              discarded.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForfeitDialog}
                className="rounded-lg border border-[color:var(--hg-border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--hg-text)] transition-colors hover:bg-[color:var(--hg-interactive-soft)]"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={handleConfirmForfeit}
                className="rounded-lg border border-red-500/60 bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-600/30"
              >
                Discard Session
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
