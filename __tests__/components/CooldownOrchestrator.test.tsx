import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CooldownOrchestrator } from '@/components/CooldownOrchestrator';

const mockSetCooldownActive = vi.fn();
const mockSetCooldownPreSpeed = vi.fn();
const mockSetCooldownSecondsRemaining = vi.fn();
const mockCommandSpeed = vi.fn();

const { mockUseTreadmillStore } = vi.hoisted(() => ({
  mockUseTreadmillStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
  }),
}));

vi.mock('@/stores', () => ({
  useTreadmillStore: mockUseTreadmillStore,
}));

vi.mock('@/lib/treadmill/control', () => ({
  commandSpeed: (...args: unknown[]) => mockCommandSpeed(...args),
}));

type MockOrchestratorState = {
  cooldownActive: boolean;
  setCooldownActive: (value: boolean) => void;
  setCooldownPreSpeed: (speed: number | null) => void;
  setCooldownSecondsRemaining: (seconds: number) => void;
  stableSpeed: number;
  cooldownSecondsRemaining: number;
};

let storeState: MockOrchestratorState;

function applyStoreState() {
  mockUseTreadmillStore.mockImplementation((selector: (state: MockOrchestratorState) => unknown) =>
    selector(storeState)
  );
  mockUseTreadmillStore.getState.mockReturnValue(storeState);
}

function setStoreState(nextState: Partial<MockOrchestratorState>) {
  storeState = { ...storeState, ...nextState };
  applyStoreState();
}

describe('CooldownOrchestrator', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    storeState = {
      cooldownActive: false,
      setCooldownActive: mockSetCooldownActive,
      setCooldownPreSpeed: mockSetCooldownPreSpeed,
      setCooldownSecondsRemaining: mockSetCooldownSecondsRemaining,
      stableSpeed: 5,
      cooldownSecondsRemaining: 0,
    };

    mockUseTreadmillStore.mockReset();
    mockUseTreadmillStore.getState = vi.fn();
    mockSetCooldownActive.mockReset();
    mockSetCooldownPreSpeed.mockReset();
    mockSetCooldownSecondsRemaining.mockReset();
    mockCommandSpeed.mockReset();
    mockCommandSpeed.mockResolvedValue(true);

    // Side effect: keep cooldownSecondsRemaining in sync so interval reads correctly
    mockSetCooldownSecondsRemaining.mockImplementation((val: number) => {
      setStoreState({ cooldownSecondsRemaining: val });
    });

    applyStoreState();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders nothing to the DOM', () => {
    const { container } = render(<CooldownOrchestrator />);

    expect(container.innerHTML).toBe('');
  });

  it('does not command speed when cooldown is inactive', () => {
    render(<CooldownOrchestrator />);

    vi.advanceTimersByTime(300_000);

    expect(mockCommandSpeed).not.toHaveBeenCalled();
  });

  it('immediately commands 3 km/h when cooldown is activated above 3 km/h', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    render(<CooldownOrchestrator />);

    expect(mockCommandSpeed).toHaveBeenCalledWith(3);
  });

  it('does not command speed when cooldown is activated at exactly 3 km/h', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 3 });

    render(<CooldownOrchestrator />);

    expect(mockCommandSpeed).not.toHaveBeenCalled();
  });

  it('does not command speed when cooldown is activated below 3 km/h', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 2 });

    render(<CooldownOrchestrator />);

    expect(mockCommandSpeed).not.toHaveBeenCalled();
  });

  it('still records pre-cooldown speed and starts countdown when activated at or below 3 km/h', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 2 });

    render(<CooldownOrchestrator />);

    expect(mockSetCooldownPreSpeed).toHaveBeenCalledWith(2);
    expect(mockSetCooldownSecondsRemaining).toHaveBeenCalledWith(300);
  });

  it('records the pre-cooldown speed when cooldown is activated', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 6 });

    render(<CooldownOrchestrator />);

    expect(mockSetCooldownPreSpeed).toHaveBeenCalledWith(6);
  });

  it('sets cooldownSecondsRemaining to 300 on activation', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    render(<CooldownOrchestrator />);

    expect(mockSetCooldownSecondsRemaining).toHaveBeenCalledWith(300);
  });

  it('decrements cooldownSecondsRemaining by 1 every second', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5, cooldownSecondsRemaining: 300 });

    render(<CooldownOrchestrator />);

    vi.advanceTimersByTime(3_000);

    // 1st call: 300 on activation; then 299, 298, 297 after each second
    expect(mockSetCooldownSecondsRemaining).toHaveBeenNthCalledWith(1, 300);
    expect(mockSetCooldownSecondsRemaining).toHaveBeenNthCalledWith(2, 299);
    expect(mockSetCooldownSecondsRemaining).toHaveBeenNthCalledWith(3, 298);
    expect(mockSetCooldownSecondsRemaining).toHaveBeenNthCalledWith(4, 297);
  });

  it('commands speed to 0 and deactivates cooldown after 300 seconds', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    render(<CooldownOrchestrator />);

    vi.advanceTimersByTime(300_000);

    expect(mockCommandSpeed).toHaveBeenCalledWith(0);
    expect(mockSetCooldownActive).toHaveBeenCalledWith(false);
  });

  it('countdown reaches 0 in the same tick as the stop command (no 0:00-before-stop drift)', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5, cooldownSecondsRemaining: 300 });

    render(<CooldownOrchestrator />);

    // Advance to the penultimate tick — countdown should be at 1, treadmill still running
    vi.advanceTimersByTime(299_000);

    expect(storeState.cooldownSecondsRemaining).toBe(1);
    expect(mockCommandSpeed).not.toHaveBeenCalledWith(0);

    // Advance the final second — countdown hits 0 and stop fires in the same interval callback
    vi.advanceTimersByTime(1_000);

    expect(storeState.cooldownSecondsRemaining).toBe(0);
    expect(mockCommandSpeed).toHaveBeenCalledWith(0);
    expect(mockSetCooldownActive).toHaveBeenCalledWith(false);
  });

  it('does not command speed to 0 when cooldown is cancelled before 300 seconds', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    const { rerender } = render(<CooldownOrchestrator />);

    // Cancel cooldown early
    setStoreState({ cooldownActive: false });
    rerender(<CooldownOrchestrator />);

    // Advance well past the original 300-second timeout
    vi.advanceTimersByTime(400_000);

    expect(mockCommandSpeed).not.toHaveBeenCalledWith(0);
  });

  it('resets cooldownSecondsRemaining and cooldownPreSpeed when deactivated', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    const { rerender } = render(<CooldownOrchestrator />);

    mockSetCooldownSecondsRemaining.mockClear();
    mockSetCooldownPreSpeed.mockClear();

    setStoreState({ cooldownActive: false });
    rerender(<CooldownOrchestrator />);

    expect(mockSetCooldownSecondsRemaining).toHaveBeenCalledWith(0);
    expect(mockSetCooldownPreSpeed).toHaveBeenCalledWith(null);
  });

  it('deactivates cooldown immediately when speed drops to zero from an external stop', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 3 });

    const { rerender } = render(<CooldownOrchestrator />);

    // Simulate STOP button setting stable speed to 0
    setStoreState({ stableSpeed: 0 });
    rerender(<CooldownOrchestrator />);

    expect(mockSetCooldownActive).toHaveBeenCalledWith(false);
  });

  it('clears the countdown interval when cooldown is deactivated', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    const { rerender } = render(<CooldownOrchestrator />);

    // Deactivate cooldown
    setStoreState({ cooldownActive: false });
    rerender(<CooldownOrchestrator />);

    // Advance time — only the initial commandSpeed(3) should have been called
    vi.advanceTimersByTime(300_000);

    expect(mockCommandSpeed).toHaveBeenCalledTimes(1);
    expect(mockCommandSpeed).toHaveBeenCalledWith(3);
  });

  it('clears the countdown interval when the component unmounts', () => {
    setStoreState({ cooldownActive: true, stableSpeed: 5 });

    const { unmount } = render(<CooldownOrchestrator />);

    unmount();

    vi.advanceTimersByTime(300_000);

    // Only the initial commandSpeed(3) was called; no further calls after unmount
    expect(mockCommandSpeed).toHaveBeenCalledTimes(1);
    expect(mockCommandSpeed).toHaveBeenCalledWith(3);
  });
});
