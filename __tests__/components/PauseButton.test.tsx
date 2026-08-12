import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PauseButton } from '@/components/treadmill/PauseButton';

const mockPause = vi.fn();
const mockSetCooldownActive = vi.fn();
const mockCommandSpeed = vi.fn();

const { mockUseTreadmillStore } = vi.hoisted(() => ({
  mockUseTreadmillStore: vi.fn(),
}));

const { mockUseWorkoutStore } = vi.hoisted(() => ({
  mockUseWorkoutStore: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useTreadmillStore: mockUseTreadmillStore,
  useWorkoutStore: mockUseWorkoutStore,
}));

vi.mock('@/lib/treadmill/control', () => ({
  commandSpeed: (...args: unknown[]) => mockCommandSpeed(...args),
}));

type MockTreadmillState = {
  mqttConnected: boolean;
  cooldownActive: boolean;
  setCooldownActive: (value: boolean) => void;
};

type MockWorkoutState = {
  status: string;
  pause: () => void;
};

let treadmillState: MockTreadmillState;
let workoutState: MockWorkoutState;

function applyStoreState() {
  mockUseTreadmillStore.mockImplementation((selector: (state: MockTreadmillState) => unknown) =>
    selector(treadmillState)
  );
  mockUseWorkoutStore.mockImplementation((selector: (state: MockWorkoutState) => unknown) =>
    selector(workoutState)
  );
}

function setTreadmillState(nextState: Partial<MockTreadmillState>) {
  treadmillState = { ...treadmillState, ...nextState };
  applyStoreState();
}

function setWorkoutState(nextState: Partial<MockWorkoutState>) {
  workoutState = { ...workoutState, ...nextState };
  applyStoreState();
}

describe('PauseButton', () => {
  beforeEach(() => {
    treadmillState = {
      mqttConnected: true,
      cooldownActive: false,
      setCooldownActive: mockSetCooldownActive,
    };

    workoutState = {
      status: 'running',
      pause: mockPause,
    };

    mockUseTreadmillStore.mockReset();
    mockUseWorkoutStore.mockReset();
    mockPause.mockReset();
    mockSetCooldownActive.mockReset();
    mockCommandSpeed.mockReset();
    mockCommandSpeed.mockResolvedValue(true);
    applyStoreState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the label PAUSE', () => {
    render(<PauseButton />);

    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeInTheDocument();
  });

  it('is enabled when the session is running and MQTT is connected', () => {
    render(<PauseButton />);

    expect(screen.getByRole('button', { name: 'PAUSE' })).not.toBeDisabled();
  });

  it('is disabled when the session is idle', () => {
    setWorkoutState({ status: 'idle' });

    render(<PauseButton />);

    const button = screen.getByRole('button', { name: 'PAUSE' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:border-[color:var(--hg-border-soft)]');
    expect(button).toHaveClass('disabled:bg-[color:var(--hg-interactive-soft)]');
    expect(button).toHaveClass('disabled:text-[color:var(--hg-disabled-text)]');
    expect(button).not.toHaveClass('disabled:border-white/10');
    expect(button).not.toHaveClass('disabled:bg-white/5');
    expect(button).not.toHaveClass('disabled:text-white/30');
  });

  it('is disabled when the session is already paused', () => {
    setWorkoutState({ status: 'paused' });

    render(<PauseButton />);

    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeDisabled();
  });

  it('is disabled when MQTT is disconnected', () => {
    setTreadmillState({ mqttConnected: false });

    render(<PauseButton />);

    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeDisabled();
  });

  it('pauses the session before stopping the belt to prevent the orchestrator from finalizing', async () => {
    const callOrder: string[] = [];
    mockPause.mockImplementation(() => callOrder.push('pause'));
    mockCommandSpeed.mockImplementation(() => {
      callOrder.push('commandSpeed');
      return Promise.resolve(true);
    });

    const user = userEvent.setup();

    render(<PauseButton />);

    await user.click(screen.getByRole('button', { name: 'PAUSE' }));

    expect(callOrder).toEqual(['pause', 'commandSpeed']);
  });

  it('stops the belt and pauses the session when clicked', async () => {
    const user = userEvent.setup();

    render(<PauseButton />);

    await user.click(screen.getByRole('button', { name: 'PAUSE' }));

    expect(mockCommandSpeed).toHaveBeenCalledWith(0);
    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('cancels an active cooldown before pausing', async () => {
    const user = userEvent.setup();
    setTreadmillState({ cooldownActive: true });

    render(<PauseButton />);

    await user.click(screen.getByRole('button', { name: 'PAUSE' }));

    expect(mockSetCooldownActive).toHaveBeenCalledWith(false);
    expect(mockCommandSpeed).toHaveBeenCalledWith(0);
    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('does not cancel cooldown if cooldown is not active', async () => {
    const user = userEvent.setup();

    render(<PauseButton />);

    await user.click(screen.getByRole('button', { name: 'PAUSE' }));

    expect(mockSetCooldownActive).not.toHaveBeenCalled();
  });
});
