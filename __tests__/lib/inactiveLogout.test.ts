import { createInactivityTimer, INACTIVE_LOGOUT_TIMEOUT_MS } from '@/lib/core/inactiveLogout';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('createInactivityTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('logs out after 10 minutes without activity', () => {
    const onTimeout = vi.fn();
    const timer = createInactivityTimer({ onTimeout });

    timer.markActivity();

    vi.advanceTimersByTime(INACTIVE_LOGOUT_TIMEOUT_MS - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('pauses during a workout and resumes with the remaining time', () => {
    const onTimeout = vi.fn();
    const timer = createInactivityTimer({ onTimeout });
    const elapsedBeforePauseMs = Math.floor(INACTIVE_LOGOUT_TIMEOUT_MS * 0.4);
    const remainingAfterPauseMs = INACTIVE_LOGOUT_TIMEOUT_MS - elapsedBeforePauseMs;

    timer.markActivity();
    vi.advanceTimersByTime(elapsedBeforePauseMs);
    timer.pause();

    vi.advanceTimersByTime(INACTIVE_LOGOUT_TIMEOUT_MS * 5);
    expect(onTimeout).not.toHaveBeenCalled();

    timer.resume();
    vi.advanceTimersByTime(remainingAfterPauseMs - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('resets to a fresh 10 minutes when activity happens while paused', () => {
    const onTimeout = vi.fn();
    const timer = createInactivityTimer({ onTimeout });
    const elapsedBeforePauseMs = Math.floor(INACTIVE_LOGOUT_TIMEOUT_MS * 0.7);

    timer.markActivity();
    vi.advanceTimersByTime(elapsedBeforePauseMs);
    timer.pause();

    timer.markActivity();
    timer.pause();

    vi.advanceTimersByTime(INACTIVE_LOGOUT_TIMEOUT_MS * 2);
    expect(onTimeout).not.toHaveBeenCalled();

    timer.resume();
    vi.advanceTimersByTime(INACTIVE_LOGOUT_TIMEOUT_MS - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledOnce();
  });
});
