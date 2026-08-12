import { describe, it, expect, beforeEach } from 'vitest';
import { useTreadmillStore } from '@/stores/treadmillStore';

describe('treadmillStore — cooldown state', () => {
  beforeEach(() => {
    // Reset the store to its default state before each test
    useTreadmillStore.setState({
      speed: 0,
      incline: 0,
      isRunning: false,
      emergencyActive: false,
      mqttConnected: false,
      cooldownActive: false,
      cooldownPreSpeed: null,
      cooldownSecondsRemaining: 0,
    });
  });

  it('initializes cooldownActive as false', () => {
    expect(useTreadmillStore.getState().cooldownActive).toBe(false);
  });

  it('sets cooldownActive to true', () => {
    useTreadmillStore.getState().setCooldownActive(true);

    expect(useTreadmillStore.getState().cooldownActive).toBe(true);
  });

  it('sets cooldownActive back to false', () => {
    useTreadmillStore.getState().setCooldownActive(true);
    useTreadmillStore.getState().setCooldownActive(false);

    expect(useTreadmillStore.getState().cooldownActive).toBe(false);
  });

  it('does not affect other state when toggling cooldownActive', () => {
    useTreadmillStore.setState({ speed: 5, mqttConnected: true });
    useTreadmillStore.getState().setCooldownActive(true);

    const state = useTreadmillStore.getState();
    expect(state.speed).toBe(5);
    expect(state.mqttConnected).toBe(true);
    expect(state.cooldownActive).toBe(true);
  });

  it('initializes cooldownPreSpeed as null', () => {
    expect(useTreadmillStore.getState().cooldownPreSpeed).toBeNull();
  });

  it('sets cooldownPreSpeed to a speed value', () => {
    useTreadmillStore.getState().setCooldownPreSpeed(5);

    expect(useTreadmillStore.getState().cooldownPreSpeed).toBe(5);
  });

  it('clears cooldownPreSpeed back to null', () => {
    useTreadmillStore.getState().setCooldownPreSpeed(5);
    useTreadmillStore.getState().setCooldownPreSpeed(null);

    expect(useTreadmillStore.getState().cooldownPreSpeed).toBeNull();
  });

  it('initializes cooldownSecondsRemaining as 0', () => {
    expect(useTreadmillStore.getState().cooldownSecondsRemaining).toBe(0);
  });

  it('sets cooldownSecondsRemaining to a positive value', () => {
    useTreadmillStore.getState().setCooldownSecondsRemaining(300);

    expect(useTreadmillStore.getState().cooldownSecondsRemaining).toBe(300);
  });

  it('sets cooldownSecondsRemaining back to 0', () => {
    useTreadmillStore.getState().setCooldownSecondsRemaining(300);
    useTreadmillStore.getState().setCooldownSecondsRemaining(0);

    expect(useTreadmillStore.getState().cooldownSecondsRemaining).toBe(0);
  });
});
