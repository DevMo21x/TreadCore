const TEN_MINUTES_IN_MS = 10 * 60 * 1000;

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

type CreateInactivityTimerOptions = {
  timeoutMs?: number;
  onTimeout: () => void;
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  cancel?: (handle: TimerHandle) => void;
};

export type InactivityTimer = {
  markActivity: () => void;
  pause: () => void;
  resume: () => void;
  clear: () => void;
};

export const INACTIVE_LOGOUT_TIMEOUT_MS = TEN_MINUTES_IN_MS;
export const INACTIVE_LOGOUT_CALLBACK_URL = '/login?reason=inactive';

export function createInactivityTimer({
  timeoutMs = INACTIVE_LOGOUT_TIMEOUT_MS,
  onTimeout,
  now = () => Date.now(),
  schedule = (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  cancel = (handle) => globalThis.clearTimeout(handle),
}: CreateInactivityTimerOptions): InactivityTimer {
  let remainingMs = timeoutMs;
  let deadline: number | null = null;
  let timeoutId: TimerHandle | null = null;

  const clearScheduledTimeout = () => {
    if (timeoutId === null) {
      return;
    }

    cancel(timeoutId);
    timeoutId = null;
  };

  const scheduleTimeout = () => {
    clearScheduledTimeout();
    deadline = now() + remainingMs;
    timeoutId = schedule(() => {
      timeoutId = null;
      deadline = null;
      remainingMs = 0;
      onTimeout();
    }, remainingMs);
  };

  return {
    markActivity() {
      remainingMs = timeoutMs;
      scheduleTimeout();
    },
    pause() {
      if (deadline === null) {
        return;
      }

      remainingMs = Math.max(deadline - now(), 0);
      deadline = null;
      clearScheduledTimeout();
    },
    resume() {
      if (timeoutId !== null) {
        return;
      }

      if (remainingMs <= 0) {
        onTimeout();
        return;
      }

      scheduleTimeout();
    },
    clear() {
      deadline = null;
      clearScheduledTimeout();
    },
  };
}
