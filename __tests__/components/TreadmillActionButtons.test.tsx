import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartTreadmillButton } from '@/components/treadmill/StartTreadmillButton';
import { StopTreadmillButton } from '@/components/treadmill/StopTreadmillButton';

const { mockUseTreadmillStore, mockStartSpeed, mockStopSpeed, mockStopIncline, mockStopTreadmill } =
  vi.hoisted(() => ({
    mockUseTreadmillStore: vi.fn(),
    mockStartSpeed: vi.fn(),
    mockStopSpeed: vi.fn(),
    mockStopIncline: vi.fn(),
    mockStopTreadmill: vi.fn(),
  }));

const { mockUseWorkoutStore } = vi.hoisted(() => ({
  mockUseWorkoutStore: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useTreadmillStore: mockUseTreadmillStore,
  useWorkoutStore: mockUseWorkoutStore,
}));

vi.mock('@/lib/treadmill/control', () => ({
  DEFAULT_START_SPEED: 1,
  startSpeed: mockStartSpeed,
  stopSpeed: mockStopSpeed,
  stopIncline: mockStopIncline,
  stopTreadmill: mockStopTreadmill,
}));

type MockTreadmillStoreState = {
  speed: number;
  incline: number;
  stableSpeed: number;
  stableIncline: number;
  mqttConnected: boolean;
  emergencyActive: boolean;
};

type MockWorkoutStoreState = {
  status: string;
};

let storeState: MockTreadmillStoreState;
let workoutState: MockWorkoutStoreState;

function applyStoreState() {
  mockUseTreadmillStore.mockImplementation(
    (selector: (state: MockTreadmillStoreState) => unknown) => selector(storeState)
  );
  mockUseWorkoutStore.mockImplementation((selector: (state: MockWorkoutStoreState) => unknown) =>
    selector(workoutState)
  );
}

function setStoreState(nextState: Partial<MockTreadmillStoreState>) {
  storeState = { ...storeState, ...nextState };
  applyStoreState();
}

function setWorkoutState(nextState: Partial<MockWorkoutStoreState>) {
  workoutState = { ...workoutState, ...nextState };
  applyStoreState();
}

describe('treadmill action buttons', () => {
  beforeEach(() => {
    storeState = {
      speed: 0,
      incline: 0,
      stableSpeed: 0,
      stableIncline: 0,
      mqttConnected: true,
      emergencyActive: false,
    };

    workoutState = {
      status: 'idle',
    };

    mockUseTreadmillStore.mockReset();
    mockUseWorkoutStore.mockReset();
    applyStoreState();

    mockStartSpeed.mockReset();
    mockStopSpeed.mockReset();
    mockStopIncline.mockReset();
    mockStopTreadmill.mockReset();

    mockStartSpeed.mockResolvedValue({ success: true, speed: 1 });
    mockStopSpeed.mockResolvedValue({ success: true });
    mockStopIncline.mockResolvedValue({ success: true });
    mockStopTreadmill.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts the treadmill at the default 1.0 km/h speed', async () => {
    const user = userEvent.setup();

    render(<StartTreadmillButton />);

    await user.click(screen.getByRole('button', { name: 'Start Treadmill' }));

    expect(mockStartSpeed).toHaveBeenCalledWith(1);
  });

  it('disables the start button when disconnected or already moving', () => {
    setStoreState({ mqttConnected: false });

    const { rerender } = render(<StartTreadmillButton />);

    expect(screen.getByRole('button', { name: 'Start Treadmill' })).toBeDisabled();

    setStoreState({ mqttConnected: true, speed: 2, stableSpeed: 2 });
    rerender(<StartTreadmillButton />);

    expect(screen.getByRole('button', { name: 'Start Treadmill' })).toBeDisabled();
  });

  it('shows the loading label while the start command is in flight', async () => {
    const user = userEvent.setup();
    let resolveStart: (() => void) | undefined;

    mockStartSpeed.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStart = () => resolve({ success: true, speed: 1 });
        })
    );

    render(<StartTreadmillButton loadingLabel="Starting Speed..." />);

    await user.click(screen.getByRole('button', { name: 'Start Treadmill' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Starting Speed...' })).toBeDisabled();
    });

    resolveStart?.();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start Treadmill' })).not.toBeDisabled();
    });
  });

  it('stops the treadmill and resets incline to zero', async () => {
    const user = userEvent.setup();

    setStoreState({ speed: 4, incline: 6, stableSpeed: 4, stableIncline: 6 });

    render(<StopTreadmillButton label="Stop Treadmill" />);

    await user.click(screen.getByRole('button', { name: 'Stop Treadmill' }));

    expect(mockStopTreadmill).toHaveBeenCalledTimes(1);
  });

  it('disables the stop button only when speed and incline are both already zero', () => {
    const { rerender } = render(<StopTreadmillButton />);

    expect(screen.getByRole('button', { name: 'Stop Treadmill' })).toBeDisabled();

    setStoreState({ speed: 0, incline: 4, stableSpeed: 0, stableIncline: 4 });

    rerender(<StopTreadmillButton />);

    expect(screen.getByRole('button', { name: 'Stop Treadmill' })).not.toBeDisabled();
  });

  it('keeps the stop button enabled when the session is paused even if speed and incline are zero', () => {
    setWorkoutState({ status: 'paused' });

    render(<StopTreadmillButton />);

    expect(screen.getByRole('button', { name: 'Stop Treadmill' })).not.toBeDisabled();
  });
});
