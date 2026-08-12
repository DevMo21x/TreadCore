import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CooldownButton } from '@/components/treadmill/CooldownButton';

const { mockUseTreadmillStore } = vi.hoisted(() => ({
  mockUseTreadmillStore: vi.fn(),
}));

const { mockUseWorkoutStore } = vi.hoisted(() => ({
  mockUseWorkoutStore: vi.fn(),
}));

const { mockCommandSpeed } = vi.hoisted(() => ({
  mockCommandSpeed: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useTreadmillStore: mockUseTreadmillStore,
  useWorkoutStore: mockUseWorkoutStore,
}));

vi.mock('@/lib/treadmill/control', () => ({
  commandSpeed: (...args: unknown[]) => mockCommandSpeed(...args),
}));

type MockCooldownStoreState = {
  speed: number;
  stableSpeed: number;
  mqttConnected: boolean;
  cooldownActive: boolean;
  setCooldownActive: (value: boolean) => void;
  cooldownPreSpeed: number | null;
  cooldownSecondsRemaining: number;
};

type MockWorkoutStoreState = {
  status: string;
};

let storeState: MockCooldownStoreState;
let workoutState: MockWorkoutStoreState;

function applyStoreState() {
  mockUseTreadmillStore.mockImplementation((selector: (state: MockCooldownStoreState) => unknown) =>
    selector(storeState)
  );
  mockUseWorkoutStore.mockImplementation((selector: (state: MockWorkoutStoreState) => unknown) =>
    selector(workoutState)
  );
}

function setStoreState(nextState: Partial<MockCooldownStoreState>) {
  storeState = { ...storeState, ...nextState };
  applyStoreState();
}

function setWorkoutState(nextState: Partial<MockWorkoutStoreState>) {
  workoutState = { ...workoutState, ...nextState };
  applyStoreState();
}

describe('CooldownButton', () => {
  beforeEach(() => {
    storeState = {
      speed: 5,
      stableSpeed: 5,
      mqttConnected: true,
      cooldownActive: false,
      setCooldownActive: vi.fn(),
      cooldownPreSpeed: null,
      cooldownSecondsRemaining: 0,
    };

    workoutState = {
      status: 'running',
    };

    mockUseTreadmillStore.mockReset();
    mockUseWorkoutStore.mockReset();
    mockCommandSpeed.mockReset();
    mockCommandSpeed.mockResolvedValue(true);
    applyStoreState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the label COOLDOWN when cooldown is not active', () => {
    render(<CooldownButton />);

    expect(screen.getByRole('button', { name: 'COOLDOWN' })).toBeInTheDocument();
  });

  it('renders with the label RESUME (5:00) when cooldown is active with 300 seconds remaining', () => {
    setStoreState({ cooldownActive: true, cooldownPreSpeed: 5, cooldownSecondsRemaining: 300 });

    render(<CooldownButton />);

    expect(screen.getByRole('button', { name: 'RESUME (5:00)' })).toBeInTheDocument();
  });

  it('renders the correct countdown when cooldown has partially elapsed', () => {
    setStoreState({ cooldownActive: true, cooldownPreSpeed: 5, cooldownSecondsRemaining: 165 });

    render(<CooldownButton />);

    expect(screen.getByRole('button', { name: 'RESUME (2:45)' })).toBeInTheDocument();
  });

  it('is disabled when the treadmill speed is zero', () => {
    setStoreState({ speed: 0, stableSpeed: 0 });

    render(<CooldownButton />);

    const button = screen.getByRole('button', { name: 'COOLDOWN' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:border-[color:var(--hg-border-soft)]');
    expect(button).toHaveClass('disabled:bg-[color:var(--hg-interactive-soft)]');
    expect(button).toHaveClass('disabled:text-[color:var(--hg-disabled-text)]');
    expect(button).not.toHaveClass('disabled:border-white/10');
    expect(button).not.toHaveClass('disabled:bg-white/5');
    expect(button).not.toHaveClass('disabled:text-white/30');
  });

  it('is disabled when MQTT is disconnected', () => {
    setStoreState({ mqttConnected: false });

    render(<CooldownButton />);

    expect(screen.getByRole('button', { name: 'COOLDOWN' })).toBeDisabled();
  });

  it('is enabled when the treadmill is moving and MQTT is connected', () => {
    render(<CooldownButton />);

    expect(screen.getByRole('button', { name: 'COOLDOWN' })).not.toBeDisabled();
  });

  it('calls setCooldownActive with true when COOLDOWN is clicked', async () => {
    const user = userEvent.setup();

    render(<CooldownButton />);

    await user.click(screen.getByRole('button', { name: 'COOLDOWN' }));

    expect(storeState.setCooldownActive).toHaveBeenCalledWith(true);
  });

  it('calls commandSpeed with the pre-cooldown speed and deactivates when RESUME is clicked', async () => {
    const user = userEvent.setup();
    setStoreState({ cooldownActive: true, cooldownPreSpeed: 5, cooldownSecondsRemaining: 200 });

    render(<CooldownButton />);

    await user.click(screen.getByRole('button', { name: 'RESUME (3:20)' }));

    expect(mockCommandSpeed).toHaveBeenCalledWith(5);
    expect(storeState.setCooldownActive).toHaveBeenCalledWith(false);
  });

  it('does not call commandSpeed when RESUME is clicked with no pre-cooldown speed recorded', async () => {
    const user = userEvent.setup();
    setStoreState({ cooldownActive: true, cooldownPreSpeed: null, cooldownSecondsRemaining: 200 });

    render(<CooldownButton />);

    await user.click(screen.getByRole('button', { name: 'RESUME (3:20)' }));

    expect(mockCommandSpeed).not.toHaveBeenCalled();
    expect(storeState.setCooldownActive).toHaveBeenCalledWith(false);
  });

  it('is disabled when the workout session is paused', () => {
    setWorkoutState({ status: 'paused' });

    render(<CooldownButton />);

    expect(screen.getByRole('button', { name: 'COOLDOWN' })).toBeDisabled();
  });
});
