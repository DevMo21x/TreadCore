/**
 * Adapter module that switches between real and mock MQTT implementations.
 *
 * Routes all MQTT operations to either the real broker client (mqtt-prod) or the mock
 * implementation (mqtt-mock) based on the MQTT_USE_MOCK environment variable. This abstraction
 * allows seamless testing and development without hardware, while maintaining a uniform API.
 * All API routes and Server Actions must import from this module, not from client or mock directly.
 *
 * @remarks
 * When MQTT_USE_MOCK === 'true', mock implementation is used. Otherwise, real broker client is used.
 *
 * @module
 */

import * as real from './client';
import * as mock from './mock';

/** Selects real or mock implementation based on environment variable. */
const provider = process.env.MQTT_USE_MOCK === 'true' ? mock : real;

/** Initializes the selected MQTT provider (real or mock). */
export const initMqtt = (): void => provider.initMqtt();

/** Retrieves the current message cache from the selected provider. */
export const getMessageStore = (): Record<string, string> => provider.getMessageStore();

/** Publishes a message using the selected provider. */
export const publishMessage = (topic: string, value: string): boolean =>
  provider.publishMessage(topic, value);

/** Registers a message listener with the selected provider. */
export const onMessage = (callback: (topic: string, value: string) => void): (() => void) =>
  provider.onMessage(callback);

/** Registers a connection status listener with the selected provider. */
export const onStatusChange = (callback: (connected: boolean) => void): (() => void) =>
  provider.onStatusChange(callback);

/** Returns the connection status from the selected provider. */
export const isMqttConnected = (): boolean => provider.isMqttConnected();
