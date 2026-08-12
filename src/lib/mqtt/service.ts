/**
 * Backend MQTT service integration for publishing commands.
 *
 * Provides functions to send treadmill commands (speed, elevation) to a backend service
 * via HTTP, which relays them to the MQTT broker. Useful for server-side operations where
 * direct MQTT access is unavailable.
 *
 * @module
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

/**
 * Publishes an event to the backend MQTT service via HTTP.
 *
 * Sends an HTTP POST request to the specified backend endpoint with query parameters,
 * which the backend translates to an MQTT publish operation. Requests are aborted if they
 * exceed 5 seconds, and detailed error context is logged on failure.
 *
 * @param path - The backend endpoint path (e.g., `/publish_speed`, `/publish_elevation`).
 * @param params - Query parameters to encode in the request URL.
 * @returns The parsed JSON response from the server, or null if the request failed.
 *
 * @throws Errors are caught and logged; this function does not throw.
 *
 * @remarks
 * Errors are logged with specific context:
 * - Network errors include the error message.
 * - Timeout errors note the 5-second limit (AbortError).
 * - Other errors are logged generically as "Publish error".
 *
 * @example
 * ```typescript
 * const response = await publish('/publish_speed', { speed: 5.2 });
 * if (response) console.log('Backend accepted command:', response);
 * ```
 */
export const publish = async (
  path: string,
  params: Record<string, string | number>
): Promise<Record<string, unknown> | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL(path, BACKEND_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof TypeError) {
      console.error('Network error:', error.message);
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timeout: Backend did not respond within 5 seconds');
    } else {
      console.error('Publish error:', error);
    }
    return null;
  }
};
