/**
 * Real MQTT client implementation for treadmill hardware communication.
 *
 * Initializes a connection to a physical MQTT broker and manages message subscriptions,
 * publishing, and real-time listener notifications. Maintains shared state via globalThis
 * to ensure consistency across Server Actions and API routes in Next.js.
 *
 * @module
 */

import { globalSingleton } from '@/lib/core/globalSingleton';
import mqtt, { MqttClient } from 'mqtt';
import { ALL_SUBSCRIPTIONS } from './topics';
import { validatePublish } from './validation';

/** MQTT broker connection URL. Defaults to local network broker on standard MQTT port. */
const BROKER_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://192.168.5.1:1883';

/** Client identifier sent to broker during connection handshake. Includes process PID to prevent ID collisions when multiple server workers connect simultaneously. */
const CLIENT_ID = `${process.env.MQTT_CLIENT_ID ?? 'treadmill-nextjs'}-${process.pid}`;

/** Retrieves the singleton MQTT client instance shared across Server Actions and API routes. */
const getClient = () => globalSingleton<MqttClient | null>('_mqttClient', () => null);

/**
 * Cache of the most recent message received for each topic.
 * Updated whenever a message arrives and provides the latest reading without re-subscribing.
 */
const messageStore = globalSingleton<Record<string, string>>('_mqttMessageStore', () => ({}));

/**
 * Set of callbacks invoked whenever a message arrives on any subscribed topic.
 * Shared across all Server Actions and API routes to enable real-time updates.
 */
const listeners = globalSingleton<Set<(topic: string, value: string) => void>>(
  '_mqttListeners',
  () => new Set()
);

/**
 * Set of callbacks invoked when connection status changes (connect or disconnect).
 * Allows consumers to react to broker availability changes.
 */
const statusListeners = globalSingleton<Set<(connected: boolean) => void>>(
  '_mqttStatusListeners',
  () => new Set()
);

/**
 * Initializes the MQTT client connection to the broker.
 *
 * Establishes a single persistent connection to the configured MQTT broker and immediately
 * subscribes to all predefined topics. Automatically reconnects if the connection drops.
 * Idempotent — safe to call multiple times.
 *
 * @remarks
 * On initial connection, all subscriptions in ALL_SUBSCRIPTIONS are created. The client will
 * automatically reconnect every 5 seconds if the connection is lost, with a 10-second timeout
 * for the initial connection attempt. Status listeners are notified on connect and disconnect.
 */
export function initMqtt(): void {
  let mqttClient = getClient();
  if (mqttClient) return;

  mqttClient = mqtt.connect(BROKER_URL, {
    clientId: CLIENT_ID,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });
  // Update the singleton
  const record = globalThis as Record<string, unknown>;
  record['_mqttClient'] = mqttClient;

  mqttClient.on('connect', () => {
    console.log('[MQTT] Connected to broker:', BROKER_URL);
    statusListeners.forEach((cb) => cb(true));
    for (const topic of ALL_SUBSCRIPTIONS) {
      mqttClient!.subscribe(topic, (err) => {
        if (err) console.error('[MQTT] Subscribe error on', topic, err);
      });
    }
  });

  mqttClient.on('message', (topic, payload) => {
    const value = payload.toString('utf8');
    messageStore[topic] = value;
    // Emit to all listeners
    listeners.forEach((cb) => cb(topic, value));
  });

  mqttClient.on('error', (err) => {
    console.error('[MQTT] Client error:', err);
  });

  mqttClient.on('disconnect', () => {
    console.log('[MQTT] Received DISCONNECT packet from broker');
  });

  mqttClient.on('close', () => {
    console.log('[MQTT] Connection closed');
    statusListeners.forEach((cb) => cb(false));
  });

  mqttClient.on('offline', () => {
    console.log('[MQTT] Client went offline');
    statusListeners.forEach((cb) => cb(false));
  });
}

/**
 * Returns the cached message store containing the latest reading for each subscribed topic.
 *
 * Provides immediate access to the most recent sensor values (speed, elevation, emergency status)
 * without waiting for new messages to arrive. Useful for initializing UI state.
 *
 * @returns Object mapping topic names to their latest string values.
 */
export function getMessageStore(): Record<string, string> {
  return messageStore;
}

/**
 * Publishes a command message to the broker on a control topic.
 *
 * Validates the topic and value against hardware bounds before publishing. Only sends if the
 * client is actively connected. Uses QoS level 1 to ensure at-least-once delivery.
 *
 * @param topic - The MQTT control topic (e.g., TOPICS.speed.control, TOPICS.elevation.control).
 * @param value - The command value as a string (typically a numeric value for speed/elevation).
 * @returns true if the message was validated and published; false if validation failed or client not connected.
 *
 * @remarks
 * Validation is performed by validatePublish(). Topics with no defined bounds are accepted without range checks.
 *
 * @example
 * ```typescript
 * const success = publishMessage(TOPICS.speed.control, '5.5');
 * if (!success) console.error('Speed command rejected');
 * ```
 */
export function publishMessage(topic: string, value: string): boolean {
  const mqttClient = getClient();
  if (!mqttClient?.connected) {
    console.warn('[MQTT] Cannot publish — client not connected');
    return false;
  }
  const validation = validatePublish(topic, value);
  if (!validation.valid) {
    return false;
  }
  mqttClient.publish(topic, value, { qos: 1 });
  return true;
}

/**
 * Registers a listener to be invoked whenever a message arrives on any subscribed topic.
 *
 * The listener is called synchronously with the topic name and message value. Multiple listeners
 * can be registered; all are invoked on each message.
 *
 * @param callback - Function called with (topic, value) for each incoming message.
 * @returns Unsubscribe function that removes this listener when called.
 *
 * @example
 * ```typescript
 * const unsubscribe = onMessage((topic, value) => {
 *   console.log(`Received on ${topic}: ${value}`);
 * });
 * // Later...
 * unsubscribe(); // Stop receiving messages
 * ```
 */
export function onMessage(callback: (topic: string, value: string) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Registers a listener to be invoked when the broker connection status changes.
 *
 * Called with true when the client connects to the broker and with false when the connection
 * is lost or the client goes offline. Useful for updating UI indicators or pausing operations
 * when the broker is unreachable.
 *
 * @param callback - Function called with true (connected) or false (disconnected).
 * @returns Unsubscribe function that removes this listener when called.
 *
 * @example
 * ```typescript
 * const unsubscribe = onStatusChange((connected) => {
 *   setConnectionStatus(connected ? 'online' : 'offline');
 * });
 * ```
 */
export function onStatusChange(callback: (connected: boolean) => void): () => void {
  statusListeners.add(callback);
  return () => statusListeners.delete(callback);
}

/**
 * Returns the current connection status of the MQTT client.
 *
 * @returns true if the client is connected to the broker; false if not connected, not initialized, or connection lost.
 */
export function isMqttConnected(): boolean {
  return getClient()?.connected ?? false;
}
