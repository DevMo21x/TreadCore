'use client';

import { useTreadmillStore, useWorkoutStore } from '@/stores';
import { commandSpeed } from '@/lib/treadmill/control';

/**
 * A blue/indigo button that pauses the active workout session.
 *
 * When tapped, the treadmill belt is stopped (speed set to 0) and the workout transitions
 * to a paused state where metric accumulation freezes. If a cooldown ramp is currently
 * active, it is cancelled before pausing.
 *
 * The button is only enabled when a session is actively running and the message broker
 * (MQTT) connection is established.
 */

export function PauseButton() {
  const mqttConnected = useTreadmillStore((state) => state.mqttConnected);
  const cooldownActive = useTreadmillStore((state) => state.cooldownActive);
  const setCooldownActive = useTreadmillStore((state) => state.setCooldownActive);
  const workoutStatus = useWorkoutStore((state) => state.status);
  const pause = useWorkoutStore((state) => state.pause);
  const speed = useTreadmillStore((state) => state.stableSpeed);

  const disabled = !mqttConnected || workoutStatus !== 'running';

  const handlePress = async () => {
    // If a cooldown ramp is in progress, cancel it before pausing
    if (cooldownActive) {
      setCooldownActive(false);
    }

    pause(speed);
    await commandSpeed(0);
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-indigo-500/60 bg-[rgba(99,102,241,0.1)] text-sm font-bold tracking-widest text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all hover:bg-[rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] disabled:shadow-none"
    >
      PAUSE
    </button>
  );
}
