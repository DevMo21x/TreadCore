'use server';

import { TOPICS } from '@/lib/mqtt/topics';

export async function setSpeed(speed: number): Promise<{ success: boolean }> {
  const { initMqtt, publishMessage } = await import('@/lib/mqtt/provider');
  initMqtt();
  const success = publishMessage(TOPICS.speed.control, speed.toString());
  return { success };
}

export async function setElevation(adc: number): Promise<{ success: boolean }> {
  const { initMqtt, publishMessage } = await import('@/lib/mqtt/provider');
  initMqtt();
  const success = publishMessage(TOPICS.elevation.control, adc.toString());
  return { success };
}
