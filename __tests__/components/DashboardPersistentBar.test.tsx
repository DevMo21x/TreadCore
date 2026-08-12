import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPersistentBar } from '@/components/dashboard/DashboardPersistentBar';

const { mockUseWorkoutStore, mockUseTreadmillStore } = vi.hoisted(() => ({
  mockUseWorkoutStore: vi.fn(),
  mockUseTreadmillStore: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useWorkoutStore: mockUseWorkoutStore,
  useTreadmillStore: mockUseTreadmillStore,
}));

vi.mock('@/components/treadmill/CooldownButton', () => ({
  CooldownButton: () => <div data-testid="cooldown-button" />,
}));

vi.mock('@/components/treadmill/InclineControl', () => ({
  InclineControl: () => <div data-testid="incline-control" />,
}));

vi.mock('@/components/treadmill/PauseButton', () => ({
  PauseButton: () => <div data-testid="pause-button" />,
}));

vi.mock('@/components/treadmill/SpeedControl', () => ({
  SpeedControl: () => <div data-testid="speed-control" />,
}));

vi.mock('@/components/treadmill/StartTreadmillButton', () => ({
  StartTreadmillButton: () => <div data-testid="start-button" />,
}));

vi.mock('@/components/treadmill/StopTreadmillButton', () => ({
  StopTreadmillButton: () => <div data-testid="stop-button" />,
}));

type MockWorkoutState = {
  elapsedSeconds: number;
  distanceKm: number;
  calories: number;
  elevationGainM: number;
  xp: number;
  startedAt: number | null;
  status: 'idle' | 'running' | 'paused';
  requestForfeit: () => void;
};

let workoutState: MockWorkoutState;
const requestForfeitSpy = vi.fn();

function applyWorkoutState() {
  mockUseWorkoutStore.mockImplementation((selector: (state: MockWorkoutState) => unknown) =>
    selector(workoutState)
  );
}

function setWorkoutState(nextState: Partial<MockWorkoutState>) {
  workoutState = { ...workoutState, ...nextState };
  applyWorkoutState();
}

describe('DashboardPersistentBar forfeit flow', () => {
  beforeEach(() => {
    requestForfeitSpy.mockReset();

    workoutState = {
      elapsedSeconds: 120,
      distanceKm: 1.23,
      calories: 42,
      elevationGainM: 4,
      xp: 15,
      startedAt: 1710000000000,
      status: 'running',
      requestForfeit: requestForfeitSpy,
    };

    mockUseWorkoutStore.mockReset();
    mockUseTreadmillStore.mockReset();
    mockUseTreadmillStore.mockImplementation(
      (selector: (state: { stableSpeed: number }) => unknown) => selector({ stableSpeed: 5.5 })
    );
    applyWorkoutState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the forfeit control when a workout session is active', () => {
    render(<DashboardPersistentBar />);

    expect(screen.getByRole('button', { name: 'Forfeit active session' })).toBeInTheDocument();
  });

  it('hides the forfeit control when no workout session is active', () => {
    setWorkoutState({ status: 'idle' });

    render(<DashboardPersistentBar />);

    expect(
      screen.queryByRole('button', { name: 'Forfeit active session' })
    ).not.toBeInTheDocument();
  });

  it('opens a confirmation dialog before forfeiting', async () => {
    const user = userEvent.setup();

    render(<DashboardPersistentBar />);

    await user.click(screen.getByRole('button', { name: 'Forfeit active session' }));

    expect(screen.getByRole('dialog', { name: 'Discard this session?' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'This session will not be saved. Your progress, distance and calories will be discarded.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard Session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep Going' })).toBeInTheDocument();
  });

  it('keeps the workout session intact when the dialog is dismissed', async () => {
    const user = userEvent.setup();

    render(<DashboardPersistentBar />);

    await user.click(screen.getByRole('button', { name: 'Forfeit active session' }));
    await user.click(screen.getByRole('button', { name: 'Keep Going' }));

    expect(screen.queryByRole('dialog', { name: 'Discard this session?' })).not.toBeInTheDocument();
    expect(requestForfeitSpy).not.toHaveBeenCalled();
  });

  it('requests a forfeit only after explicit confirmation', async () => {
    const user = userEvent.setup();

    render(<DashboardPersistentBar />);

    await user.click(screen.getByRole('button', { name: 'Forfeit active session' }));
    await user.click(screen.getByRole('button', { name: 'Discard Session' }));

    expect(requestForfeitSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Discard this session?' })).not.toBeInTheDocument();
  });
});
