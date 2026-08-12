'use client';

import React, { useContext, useState } from 'react';
import { stopTreadmill } from '@/lib/treadmill/control';
import PresetRunnerContext from '@/context/PresetRunnerContext';
import { useTreadmillStore, useWorkoutStore } from '@/stores';

type StopTreadmillButtonProps = Readonly<{
  label?: string;
  loadingLabel?: string;
  className?: string;
}>;

function getStopButtonClassName({
  className,
  emergencyActive,
}: Readonly<{
  className?: string;
  emergencyActive: boolean;
}>): string {
  if (className) {
    return className;
  }

  return `flex h-20 w-full items-center justify-center rounded-xl border-2 bg-[rgba(214,0,74,0.1)] text-[var(--hg-tertiary)] shadow-[0_0_20px_rgba(255,46,99,0.2)] transition-all hover:bg-[rgba(214,0,74,0.2)] hover:shadow-[0_0_30px_rgba(255,46,99,0.4)] disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] disabled:shadow-none ${
    emergencyActive
      ? 'border-[var(--hg-tertiary)] shadow-[0_0_30px_rgba(255,46,99,0.35)]'
      : 'border-[var(--hg-tertiary)]'
  }`;
}

export function StopTreadmillButton({
  label = 'Stop Treadmill',
  loadingLabel = 'Stopping Treadmill...',
  className,
}: StopTreadmillButtonProps) {
  const mqttConnected = useTreadmillStore((state) => state.mqttConnected);
  const currentSpeed = useTreadmillStore((state) => state.stableSpeed);
  const currentIncline = useTreadmillStore((state) => state.stableIncline);
  const emergencyActive = useTreadmillStore((state) => state.emergencyActive);
  const workoutStatus = useWorkoutStore((state) => state.status);
  const [loading, setLoading] = useState(false);

  // The button should remain enabled when the session is paused (speed and incline are both 0)
  // so the user can fully end a paused session without needing to restart the belt first
  const isPaused = workoutStatus === 'paused';
  const disabled =
    loading || !mqttConnected || (!isPaused && currentSpeed === 0 && currentIncline === 0);
  const resolvedClassName = getStopButtonClassName({ className, emergencyActive });

  const runner = useContext(PresetRunnerContext);

  const handleStop = async () => {
    setLoading(true);
    try {
      // Ensure any active preset runner is cancelled so UI/runner state is cleared
      try {
        runner?.cancelPreset?.();
      } catch (e) {
        // swallowing errors to preserve stop behaviour
      }

      await stopTreadmill();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleStop} disabled={disabled} className={resolvedClassName}>
      {loading ? loadingLabel : label}
    </button>
  );
}
