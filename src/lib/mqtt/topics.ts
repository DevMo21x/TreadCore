/**
 * MQTT topic definitions for treadmill hardware communication.
 *
 * Defines standardized topic names for speed and elevation control, as well as emergency stop.
 * Topics are organized into reading (sensor) and control (command) pairs. The device ID is fixed
 * in the topic paths, allowing the frontend to communicate with a specific treadmill device.
 *
 * @module
 */

/** Unique identifier for the treadmill device in MQTT topic paths. */
const DEVICE_ID = 'T9800-1';

/**
 * MQTT topic names for treadmill sensor readings and control commands.
 *
 * Organized by domain (elevation, speed) with reading and control variants:
 * - `reading` topics emit sensor data from the hardware.
 * - `control` topics receive commands from the frontend.
 * - `emergency` topic receives emergency stop signals.
 *
 * @remarks
 * Each topic is constructed using the fixed DEVICE_ID. Topics are immutable (as const)
 * to ensure type safety and prevent runtime topic typos.
 */
export const TOPICS = {
  /** Elevation sensor reading and control topics. */
  elevation: {
    /** Reading topic for current incline level. */
    reading: `/${DEVICE_ID}/readings/elevation`,
    /** Control topic to command elevation adjustment. */
    control: `/${DEVICE_ID}/control/elevation`,
  },
  /** Speed sensor reading and control topics. */
  speed: {
    /** Reading topic for current speed. */
    reading: `/${DEVICE_ID}/readings/speed`,
    /** Control topic to command speed adjustment. */
    control: `/${DEVICE_ID}/control/speed`,
  },
  /** Emergency stop topic. Triggers hardware emergency stop when published. */
  emergency: `/${DEVICE_ID}/emergency`,
} as const;

/**
 * List of all topics the client automatically subscribes to on connection.
 *
 * Includes sensor reading topics and the emergency topic. Control topics are not subscribed to
 * (only published to) as the frontend does not need to receive its own commands.
 */
export const ALL_SUBSCRIPTIONS = [
  TOPICS.elevation.reading,
  TOPICS.speed.reading,
  TOPICS.emergency,
] as const;
