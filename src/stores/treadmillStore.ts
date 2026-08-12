import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Zustand store containing real-time treadmill hardware state.
 *
 * This store is the single source of truth for physical treadmill operation state — speed,
 * incline, running status, and emergency conditions. It should not contain UI state or workout
 * session data. State is updated by the treadmill service via MQTT feedback.
 *
 * @module
 */

/**
 * Represents the real-time hardware state of the treadmill.
 */
interface TreadmillState {
  /** Current belt speed in km/h. Raw hardware value — debug/diagnostic only. Do not use in business logic or UI display. */
  speed: number;
  /** Current incline level. Raw hardware value — debug/diagnostic only. Do not use in business logic or UI display. */
  incline: number;
  /**
   * Purely frontend-commanded belt speed in km/h. Hardware feedback never modifies this value.
   *
   * Set immediately when a speed command is issued. UI components and business logic
   * should consume this instead of `speed`.
   */
  stableSpeed: number;
  /**
   * Purely frontend-commanded incline level (0–10). Hardware feedback never modifies this value.
   *
   * Set immediately when an incline command is issued. UI components and business logic
   * should consume this instead of the raw `incline`.
   */
  stableIncline: number;
  /** Whether the treadmill belt is currently moving. */
  isRunning: boolean;
  /** Whether an emergency stop has been triggered by the hardware. */
  emergencyActive: boolean;
  /** Whether the MQTT broker connection is currently active. */
  mqttConnected: boolean;
  /** Whether the cooldown mode is currently active (holding at 3 km/h for 5 minutes then stopping). */
  cooldownActive: boolean;
  /** The belt speed (km/h) recorded when cooldown was activated. Null when cooldown is inactive. */
  cooldownPreSpeed: number | null;
  /** Seconds remaining in the cooldown hold. Zero when cooldown is inactive. */
  cooldownSecondsRemaining: number;

  /**
   * Updates the belt speed to the specified value.
   *
   * @param speed - The new speed in km/h.
   * @remarks This should only be called by `treadmillService`.
   */
  setSpeed: (speed: number) => void;
  /**
   * Updates the incline level to the specified value.
   *
   * @param incline - The new incline level.
   * @remarks This should only be called by `treadmillService`.
   */
  setIncline: (incline: number) => void;
  /**
   * Sets the stable (commanded) speed directly.
   *
   * Called by command functions when issuing a speed command to the hardware.
   * This is what the UI and business logic see as "the current speed".
   *
   * @param speed - The commanded speed in km/h.
   */
  setStableSpeed: (speed: number) => void;
  /**
   * Sets the stable (commanded) incline directly.
   *
   * Called by command functions when issuing an incline command to the hardware.
   * This is what the UI and business logic see as "the current incline".
   *
   * @param incline - The commanded incline level.
   */
  setStableIncline: (incline: number) => void;
  /**
   * Updates the running state of the treadmill belt.
   *
   * @param isRunning - Whether the belt should be running.
   * @remarks This should only be called by `treadmillService`.
   */
  setIsRunning: (isRunning: boolean) => void;
  /**
   * Updates the emergency stop state.
   *
   * @param emergencyActive - Whether the emergency stop is active.
   * @remarks This should only be called by `treadmillService`.
   */
  setEmergencyActive: (emergencyActive: boolean) => void;
  /**
   * Updates the MQTT broker connection status.
   *
   * @param mqttConnected - Whether the MQTT connection is active.
   * @remarks This should only be called by `useHardwareFeedback`.
   */
  setMqttConnected: (mqttConnected: boolean) => void;
  /**
   * Sets the cooldown mode active or inactive.
   *
   * @param cooldownActive - Whether the cooldown ramp should be running.
   */
  setCooldownActive: (cooldownActive: boolean) => void;
  /**
   * Records the belt speed at the time cooldown was activated, for restoration on RESUME.
   *
   * @param speed - The speed to restore, or null to clear.
   */
  setCooldownPreSpeed: (speed: number | null) => void;
  /**
   * Updates the remaining cooldown seconds for the countdown display.
   *
   * @param seconds - The new remaining seconds value.
   */
  setCooldownSecondsRemaining: (seconds: number) => void;
}

/**
 * Zustand hook for accessing the treadmill hardware state store.
 *
 * Provides real-time access to treadmill speed, incline, running status, and connection state.
 * Subscribe to specific properties to minimize re-renders when only those values change.
 *
 * @returns The treadmill state store with both state properties and setter actions.
 *
 * @example
 * const speed = useTreadmillStore((state) => state.speed);
 * const setSpeed = useTreadmillStore((state) => state.setSpeed);
 */
export const useTreadmillStore = create<TreadmillState>()(
  subscribeWithSelector((set) => {
    return {
      speed: 0,
      incline: 0,
      stableSpeed: 0,
      stableIncline: 0,
      isRunning: false,
      emergencyActive: false,
      mqttConnected: false,
      cooldownActive: false,
      cooldownPreSpeed: null,
      cooldownSecondsRemaining: 0,

      setSpeed: (speed) => set({ speed }),
      setIncline: (incline) => set({ incline }),
      setStableSpeed: (stableSpeed) => set({ stableSpeed }),
      setStableIncline: (stableIncline) => set({ stableIncline }),
      setIsRunning: (isRunning) => set({ isRunning }),
      setEmergencyActive: (emergencyActive) => set({ emergencyActive }),
      setMqttConnected: (mqttConnected) => set({ mqttConnected }),
      setCooldownActive: (cooldownActive) => set({ cooldownActive }),
      setCooldownPreSpeed: (cooldownPreSpeed) => set({ cooldownPreSpeed }),
      setCooldownSecondsRemaining: (cooldownSecondsRemaining) => set({ cooldownSecondsRemaining }),
    };
  })
);
