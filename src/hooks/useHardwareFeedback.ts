'use client';

import { useEffect } from 'react';
import {
  updateSpeedFromHardware,
  updateElevationFromHardware,
  updateEmergencyFromHardware,
} from '@/lib/treadmill/control';
import { TOPICS } from '@/lib/mqtt/topics';
import { useTreadmillStore } from '@/stores';

/**
 * Hook to subscribe to hardware feedback via SSE.
 * Automatically updates Zustand store when hardware state changes.
 * Call once in root layout or provider.
 */
export function useHardwareFeedback() {
  const setMqttConnected = useTreadmillStore((state) => state.setMqttConnected);

  useEffect(() => {
    const eventSource = new EventSource('/api/mqtt/stream');

    eventSource.addEventListener('message', (event) => {
      try {
        const { topic, value } = JSON.parse(event.data);

        if (topic === TOPICS.speed.reading) {
          updateSpeedFromHardware(value);
        } else if (topic === TOPICS.elevation.reading) {
          updateElevationFromHardware(value);
        } else if (topic === TOPICS.emergency) {
          updateEmergencyFromHardware(value);
        }
      } catch (err) {
        console.error('[SSE] Error parsing message:', err);
      }
    });

    eventSource.addEventListener('status', (event) => {
      try {
        const { connected } = JSON.parse((event as MessageEvent).data);
        setMqttConnected(connected);
      } catch (err) {
        console.error('[SSE] Error parsing status event:', err);
      }
    });

    eventSource.addEventListener('error', () => {
      console.error('[SSE] Connection error — browser will auto-reconnect');
    });

    return () => {
      eventSource.close();
    };
  }, [setMqttConnected]);
}
