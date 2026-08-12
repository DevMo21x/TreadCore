/**
 * Mock MQTT implementation for testing and development without hardware.
 *
 * Simulates a treadmill responding to speed and elevation commands by updating internal state
 * and notifying listeners. Activated when MQTT_USE_MOCK=true in environment. Does not emit
 * periodic updates — only responds to published commands. State persists across module reloads
 * via globalThis for consistency in Next.js development.
 *
 * @module
 */

import { TOPICS } from './topics';
import { globalSingleton } from '@/lib/core/globalSingleton';
import { validatePublish } from './validation';

/** Set of callbacks invoked when the mock receives a command and updates state. */
const listeners = globalSingleton<Set<(topic: string, value: string) => void>>(
  '_mqttMockListeners',
  () => new Set()
);

/**
 * Simulated treadmill state. Initially both speed and elevation are zero.
 * Emergency stop is always false in mock (not yet implemented).
 */
const messageStore = globalSingleton<Record<string, string>>('_mqttMockMessageStore', () => ({
  [TOPICS.elevation.reading]: '0',
  [TOPICS.speed.reading]: '0',
  [TOPICS.emergency]: 'false',
}));

/** Tracks whether the mock has been initialized (always considered "connected"). */
const initialized = globalSingleton<{ value: boolean }>('_mqttMockInitialized', () => ({
  value: false,
}));

/**
 * Initializes the mock MQTT service.
 *
 * Marks the mock as initialized so that isMqttConnected() returns true. The mock is immediately
 * considered "connected" and does not establish any real network connection. Idempotent.
 *
 * @remarks
 * The mock does not emit periodic updates. It only responds to publishMessage() calls by
 * updating internal state and notifying listeners.
 */
export function initMqtt(): void {
  if (initialized.value) return;
  initialized.value = true;
  console.log('[MQTT Mock] Using simulated treadmill (responds to commands only)');
}

/**
 * Returns the simulated treadmill state.
 *
 * @returns Object containing the current speed reading, elevation reading, and emergency status.
 */
export function getMessageStore(): Record<string, string> {
  return messageStore;
}

/**
 * Publishes a simulated command to the mock treadmill.
 *
 * Validates the topic and value, then immediately updates internal state to reflect the command.
 * Notifies all listeners of the corresponding reading topic with the new value. Unrecognized topics
 * are rejected.
 *
 * @param topic - The control topic (e.g., TOPICS.speed.control, TOPICS.elevation.control).
 * @param value - The command value as a string (must be numeric and within bounds).
 * @returns true if the command was validated and applied; false otherwise.
 *
 * @remarks
 * Speed commands update TOPICS.speed.reading. Elevation commands update TOPICS.elevation.reading.
 * Commands are validated via validatePublish() before being applied.
 *
 * @example
 * ```typescript
 * publishMessage(TOPICS.speed.control, '5');
 * // messageStore[TOPICS.speed.reading] === '5'
 * // All listeners called with (TOPICS.speed.reading, '5')
 * ```
 */
export function publishMessage(topic: string, value: string): boolean {
  console.log('[MQTT Mock] Command received:', topic, value);

  const validation = validatePublish(topic, value);
  if (!validation.valid) {
    console.warn('[MQTT Mock] Publish rejected:', validation.reason);
    return false;
  }

  // Parse the command and update internal state
  if (topic === TOPICS.speed.control) {
    const speed = parseFloat(value);
    const speedStr = speed.toString();
    messageStore[TOPICS.speed.reading] = speedStr;
    console.log('[MQTT Mock] Speed set to:', speed);
    listeners.forEach((cb) => cb(TOPICS.speed.reading, speedStr));
    return true;
  } else if (topic === TOPICS.elevation.control) {
    const elevation = parseFloat(value);
    const elevationStr = elevation.toString();
    messageStore[TOPICS.elevation.reading] = elevationStr;
    console.log('[MQTT Mock] Elevation set to:', elevation);
    listeners.forEach((cb) => cb(TOPICS.elevation.reading, elevationStr));
    return true;
  } else {
    console.warn('[MQTT Mock] Unrecognized topic:', topic);
  }
  return false;
}

/**
 * Registers a listener to be invoked when the mock publishes a reading update.
 *
 * The listener is called with the reading topic and updated value whenever a command
 * is processed and state changes (e.g., speed.control → speed.reading).
 *
 * @param callback - Function called with (topic, value) for each reading update.
 * @returns Unsubscribe function that removes this listener when called.
 */
export function onMessage(callback: (topic: string, value: string) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Registers a listener to be notified of connection status changes.
 *
 * In the mock implementation, the callback is immediately invoked with true (always connected)
 * and a no-op unsubscribe function is returned, reflecting that the mock is a local simulation
 * with no actual connection state.
 *
 * @param callback - Function called with connection status (always called with true immediately).
 * @returns No-op unsubscribe function (no-op because mock is always "connected").
 */
export function onStatusChange(callback: (connected: boolean) => void): () => void {
  callback(true);
  return () => {};
}

/**
 * Returns whether the mock is initialized (always "connected").
 *
 * @returns true if initMqtt() has been called; false otherwise.
 */
export function isMqttConnected(): boolean {
  return initialized.value;
}
