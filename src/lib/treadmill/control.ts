'use client';

import { setSpeed, setElevation } from '@/lib/actions/treadmill';
import { INCLINE_TO_ADC, MIN_ADC, adcToLevel } from '@/lib/constants/adcMaps';
import { useTreadmillStore } from '@/stores';

// Constants
const MAX_SPEED = 10;
const SPEED_INCREMENT = 0.5;
const MAX_INCLINE = 10;
const INCLINE_INCREMENT = 1;
export const DEFAULT_START_SPEED = 1;

/**
 * Send a speed command to the hardware via Server Action.
 * Immediately updates stableSpeed so the UI reflects the intent.
 * Hardware feedback via SSE updates the raw store value for monitoring.
 * @param speed - The speed value to command (0-10)
 */
export const commandSpeed = async (speed: number): Promise<boolean> => {
  useTreadmillStore.getState().setStableSpeed(speed);
  const { success } = await setSpeed(speed);
  return success;
};

/**
 * Start the treadmill at a fixed minimum speed, defaulting to 1.0 km/h.
 * @param speed - Optional override speed to command when starting.
 * @returns The success status and commanded speed value.
 */
export const startSpeed = async (
  speed = DEFAULT_START_SPEED
): Promise<{ success: boolean; speed: number }> => {
  const newSpeed = Math.max(DEFAULT_START_SPEED, Math.min(speed, MAX_SPEED));
  const success = await commandSpeed(newSpeed);
  return { success, speed: newSpeed };
};

/**
 * Send an incline command to the hardware via Server Action.
 * Immediately updates stableIncline so the UI reflects the intent.
 * Hardware feedback via SSE updates the raw store value for monitoring.
 * @param level - The incline level (0-10)
 */
export const commandIncline = async (level: number): Promise<boolean> => {
  const clamped = Math.max(0, Math.min(level, 10));
  const adc = Math.max(MIN_ADC, INCLINE_TO_ADC[clamped]);
  useTreadmillStore.getState().setStableIncline(clamped);
  const { success } = await setElevation(adc);
  return success;
};

/**
 * Increase speed by the configured increment (0.5 km/h), up to MAX_SPEED.
 * @returns The new speed value
 */
export const increaseSpeed = async (): Promise<{ success: boolean; speed: number }> => {
  const currentSpeed = useTreadmillStore.getState().stableSpeed;
  const newSpeed = Math.min(currentSpeed + SPEED_INCREMENT, MAX_SPEED);
  const success = await commandSpeed(newSpeed);
  return { success, speed: newSpeed };
};

/**
 * Decrease speed by the configured increment (0.5 km/h), down to 0.
 * @returns The success status and new speed value
 */
export const decreaseSpeed = async (): Promise<{ success: boolean; speed: number }> => {
  const currentSpeed = useTreadmillStore.getState().stableSpeed;
  const newSpeed = Math.max(currentSpeed - SPEED_INCREMENT, 0);
  const success = await commandSpeed(newSpeed);
  return { success, speed: newSpeed };
};

/**
 * Stop the treadmill by setting speed to 0.
 * @returns The success status
 */
export const stopSpeed = async (): Promise<{ success: boolean }> => {
  const success = await commandSpeed(0);
  return { success };
};

/**
 * Stop the treadmill by stopping the belt and resetting incline to 0.
 * @returns The combined success status for both commands.
 */
export const stopTreadmill = async (): Promise<{ success: boolean }> => {
  const [speedResult, inclineResult] = await Promise.all([stopSpeed(), stopIncline()]);
  return {
    success: speedResult.success && inclineResult.success,
  };
};

/**
 * Increase incline by 1 level, up to MAX_INCLINE (10).
 * @returns The success status and new incline level
 */
export const increaseIncline = async (): Promise<{ success: boolean; incline: number }> => {
  const currentIncline = useTreadmillStore.getState().stableIncline;
  const newIncline = Math.min(currentIncline + INCLINE_INCREMENT, MAX_INCLINE);
  const success = await commandIncline(newIncline);
  return { success, incline: newIncline };
};

/**
 * Decrease incline by 1 level, down to 0.
 * @returns The success status and new incline level
 */
export const decreaseIncline = async (): Promise<{ success: boolean; incline: number }> => {
  const currentIncline = useTreadmillStore.getState().stableIncline;
  const newIncline = Math.max(currentIncline - INCLINE_INCREMENT, 0);
  const success = await commandIncline(newIncline);
  return { success, incline: newIncline };
};

/**
 * Stop incline by setting it to 0.
 * @returns The success status
 */
export const stopIncline = async (): Promise<{ success: boolean }> => {
  const success = await commandIncline(0);
  return { success };
};

/**
 * Update speed in store from hardware feedback (SSE).
 * Called by useHardwareFeedback hook when SSE receives speed update.
 */
export const updateSpeedFromHardware = (speed: string) => {
  useTreadmillStore.getState().setSpeed(parseFloat(speed));
};

/**
 * Update elevation in store from hardware feedback (SSE).
 * Called by useHardwareFeedback hook when SSE receives elevation update.
 */
export const updateElevationFromHardware = (elevation: string) => {
  const adc = parseFloat(elevation);
  const level = isNaN(adc) ? 0 : adcToLevel(adc);
  useTreadmillStore.getState().setIncline(level);
};

/**
 * Update emergency state in store from hardware feedback (SSE).
 * Called by useHardwareFeedback hook when SSE receives emergency topic update.
 */
export const updateEmergencyFromHardware = (value: string) => {
  useTreadmillStore.getState().setEmergencyActive(value === 'true');
};
