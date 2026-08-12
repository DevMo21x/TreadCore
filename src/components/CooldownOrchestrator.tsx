'use client';

import { useEffect, useRef } from 'react';
import { useTreadmillStore } from '@/stores';
import { commandSpeed } from '@/lib/treadmill/control';

/** Speed (km/h) the belt is held at during cooldown. */
const COOLDOWN_SPEED = 3;

/** Duration of the cooldown hold in seconds (5 minutes). */
const COOLDOWN_DURATION_SECONDS = 300;

/**
 * Headless orchestrator component that manages cooldown mode.
 *
 * When cooldown mode is activated, this component:
 *  1. Records the current speed as `cooldownPreSpeed` for restoration on RESUME.
 *  2. Commands the belt to COOLDOWN_SPEED (3 km/h) only if the current speed exceeds it;
 *     if the belt is already at or below 3 km/h the speed is left unchanged.
 *  3. Runs a 1-second countdown, decrementing `cooldownSecondsRemaining` each tick.
 *  4. After COOLDOWN_DURATION_SECONDS (5 minutes), stops the treadmill and deactivates cooldown.
 *
 * If cooldown is deactivated early (RESUME button pressed or manual speed change), the
 * countdown and stop timeout are cleared and state is reset. The CooldownButton handles
 * restoring the pre-cooldown speed when the user taps RESUME.
 *
 * This component renders nothing to the DOM.
 */
export function CooldownOrchestrator() {
  const cooldownActive = useTreadmillStore((state) => state.cooldownActive);
  const setCooldownActive = useTreadmillStore((state) => state.setCooldownActive);
  const setCooldownPreSpeed = useTreadmillStore((state) => state.setCooldownPreSpeed);
  const setCooldownSecondsRemaining = useTreadmillStore(
    (state) => state.setCooldownSecondsRemaining
  );
  const speed = useTreadmillStore((state) => state.stableSpeed);

  // Immediately deactivate cooldown whenever stable speed reaches zero — covers external STOP,
  // emergency stop, or the natural finish arriving between countdown ticks.
  useEffect(() => {
    if (cooldownActive && speed === 0) {
      setCooldownActive(false);
    }
  }, [cooldownActive, speed, setCooldownActive]);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!cooldownActive) {
      // Cleanup: clear the countdown timer and reset related state
      if (countdownRef.current !== null) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      // Only write if not already reset — avoids redundant store updates on every
      // re-render while cooldown is inactive.
      if (useTreadmillStore.getState().cooldownSecondsRemaining !== 0) {
        setCooldownSecondsRemaining(0);
      }
      // Only write if not already reset — avoids redundant store updates on every
      // re-render while cooldown is inactive.
      if (useTreadmillStore.getState().cooldownPreSpeed !== null) {
        setCooldownPreSpeed(null);
      }
      return;
    }

    // Record the pre-cooldown speed, then command the cooldown speed only if above it
    const preSpeed = useTreadmillStore.getState().stableSpeed;
    setCooldownPreSpeed(preSpeed);
    if (preSpeed > COOLDOWN_SPEED) {
      commandSpeed(COOLDOWN_SPEED);
    }
    setCooldownSecondsRemaining(COOLDOWN_DURATION_SECONDS);

    // Decrement the countdown every second; stop the treadmill when it reaches zero
    countdownRef.current = setInterval(() => {
      const remaining = useTreadmillStore.getState().cooldownSecondsRemaining;
      if (remaining > 0) {
        const next = remaining - 1;
        setCooldownSecondsRemaining(next);
        if (next === 0) {
          commandSpeed(0);
          setCooldownActive(false);
        }
      }
    }, 1_000);

    return () => {
      if (countdownRef.current !== null) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [cooldownActive, setCooldownActive, setCooldownPreSpeed, setCooldownSecondsRemaining]);

  return null;
}
