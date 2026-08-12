/**
 * Validation rules and bounds for MQTT control commands.
 *
 * Enforces hardware constraints on speed and elevation commands before publishing.
 * Topics without explicit bounds are passed through without validation.
 * Update this file as hardware limits are confirmed or revised.
 *
 * @module
 */

import { TOPICS } from './topics';

/**
 * Numeric bounds for control topics.
 *
 * Each entry maps a control topic to its valid range (min/max inclusive).
 * Topics absent from this map are accepted without range validation.
 *
 * @remarks
 * - Speed: 0–10 kph
 * - Elevation: 175–800 in hardware units (currently ADC counts)
 */
export const MQTT_BOUNDS: Partial<Record<string, { min: number; max: number }>> = {
  [TOPICS.speed.control]: { min: 0, max: 10 },
  [TOPICS.elevation.control]: { min: 175, max: 800 },
};

/**
 * Validates a command value against hardware bounds for a given control topic.
 *
 * Checks that the value is a valid number within the defined range for the topic.
 * Topics without bounds entries are considered valid (permissive).
 *
 * @param topic - The control topic being validated (e.g., TOPICS.speed.control).
 * @param value - The command value as a string.
 * @returns Object with valid=true if the value passes validation, or valid=false with a descriptive reason.
 *
 * @remarks
 * Non-numeric values are rejected with a "not a number" reason. Out-of-bounds values include
 * the actual bounds in the reason message to aid debugging.
 *
 * @example
 * ```typescript
 * const result = validatePublish(TOPICS.speed.control, '5');
 * // result => { valid: true }
 *
 * const invalid = validatePublish(TOPICS.speed.control, '15');
 * // invalid => { valid: false, reason: 'Value 15 is out of bounds for topic "..." (valid: 0–10)' }
 * ```
 */
export function validatePublish(topic: string, value: string): { valid: boolean; reason?: string } {
  const bounds = MQTT_BOUNDS[topic];
  if (!bounds) return { valid: true };

  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, reason: `Value "${value}" is not a number` };
  }
  if (num < bounds.min || num > bounds.max) {
    return {
      valid: false,
      reason: `Value ${num} is out of bounds for topic "${topic}" (valid: ${bounds.min}–${bounds.max})`,
    };
  }
  return { valid: true };
}
