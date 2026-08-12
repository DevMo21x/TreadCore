'use client';

import { commandSpeed } from '@/lib/treadmill/control';
import { useTreadmillStore, useWorkoutStore } from '@/stores';

/**
 * Formats a number of seconds as M:SS (e.g. 300 → "5:00", 65 → "1:05").
 */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * A persistent amber/orange button that activates or cancels the cooldown mode.
 *
 * When tapped, cooldown mode starts a 5-minute timer. If the current speed is above 3 km/h
 * it is immediately set to 3 km/h; otherwise the speed is left unchanged. The button shows
 * a live countdown while active. Tapping RESUME cancels the cooldown and restores the speed
 * to whatever it was when cooldown was started.
 * The button is disabled when the treadmill is not moving, the message broker (MQTT)
 * connection is lost, or the workout session is currently paused.
 */
export function CooldownButton() {
  const speed = useTreadmillStore((state) => state.stableSpeed);
  const mqttConnected = useTreadmillStore((state) => state.mqttConnected);
  const cooldownActive = useTreadmillStore((state) => state.cooldownActive);
  const setCooldownActive = useTreadmillStore((state) => state.setCooldownActive);
  const cooldownPreSpeed = useTreadmillStore((state) => state.cooldownPreSpeed);
  const cooldownSecondsRemaining = useTreadmillStore((state) => state.cooldownSecondsRemaining);
  const workoutStatus = useWorkoutStore((state) => state.status);

  // Cooldown cannot be activated while the session is paused
  const disabled = !mqttConnected || speed === 0 || workoutStatus === 'paused';

  const handlePress = () => {
    if (cooldownActive) {
      // Snapshot preSpeed before deactivating — orchestrator cleanup nulls it on setCooldownActive(false)
      if (cooldownPreSpeed !== null) {
        commandSpeed(cooldownPreSpeed);
      }
      setCooldownActive(false);
    } else {
      setCooldownActive(true);
    }
  };

  const label = cooldownActive
    ? `RESUME (${formatCountdown(cooldownSecondsRemaining)})`
    : 'COOLDOWN';

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={disabled}
      className={`flex h-14 w-full items-center justify-center rounded-xl border-2 text-sm font-bold tracking-widest transition-all disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] disabled:shadow-none ${
        cooldownActive
          ? 'border-amber-400 bg-[rgba(245,158,11,0.2)] text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
          : 'border-amber-500/60 bg-[rgba(245,158,11,0.1)] text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:bg-[rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]'
      }`}
    >
      {label}
    </button>
  );
}
