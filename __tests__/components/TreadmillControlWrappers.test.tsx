import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InclineControl } from '@/components/treadmill/InclineControl';
import { SpeedControl } from '@/components/treadmill/SpeedControl';

const {
  mockUseTreadmillStore,
  mockIncreaseSpeed,
  mockDecreaseSpeed,
  mockCommandSpeed,
  mockIncreaseIncline,
  mockDecreaseIncline,
  mockCommandIncline,
  mockSetCooldownActive,
} = vi.hoisted(() => ({
  mockUseTreadmillStore: vi.fn(),
  mockIncreaseSpeed: vi.fn(),
  mockDecreaseSpeed: vi.fn(),
  mockCommandSpeed: vi.fn(),
  mockIncreaseIncline: vi.fn(),
  mockDecreaseIncline: vi.fn(),
  mockCommandIncline: vi.fn(),
  mockSetCooldownActive: vi.fn(),
}));

const mockUseWorkoutStore = vi.hoisted(() =>
  vi.fn((selector) =>
    selector({
      pausedSpeed: null,
      status: 'running',
    })
  )
);

vi.mock('@/stores', () => ({
  useTreadmillStore: mockUseTreadmillStore,
  useWorkoutStore: mockUseWorkoutStore,
}));

vi.mock('@/lib/treadmill/control', () => ({
  increaseSpeed: mockIncreaseSpeed,
  decreaseSpeed: mockDecreaseSpeed,
  commandSpeed: mockCommandSpeed,
  increaseIncline: mockIncreaseIncline,
  decreaseIncline: mockDecreaseIncline,
  commandIncline: mockCommandIncline,
}));

type MockTreadmillStoreState = {
  speed: number;
  incline: number;
  stableSpeed: number;
  stableIncline: number;
  mqttConnected: boolean;
  cooldownActive: boolean;
  setCooldownActive: (value: boolean) => void;
};

let storeState: MockTreadmillStoreState;

function applyStoreState() {
  mockUseTreadmillStore.mockImplementation(
    (selector: (state: MockTreadmillStoreState) => unknown) => selector(storeState)
  );
}

function setStoreState(nextState: Partial<MockTreadmillStoreState>) {
  storeState = { ...storeState, ...nextState };
  applyStoreState();
}

describe('treadmill control wrappers', () => {
  beforeEach(() => {
    storeState = {
      speed: 4,
      incline: 4,
      stableSpeed: 4,
      stableIncline: 4,
      mqttConnected: true,
      cooldownActive: false,
      setCooldownActive: mockSetCooldownActive,
    };

    mockUseTreadmillStore.mockReset();
    applyStoreState();

    mockIncreaseSpeed.mockReset();
    mockDecreaseSpeed.mockReset();
    mockCommandSpeed.mockReset();
    mockIncreaseIncline.mockReset();
    mockDecreaseIncline.mockReset();
    mockCommandIncline.mockReset();
    mockSetCooldownActive.mockReset();

    mockIncreaseSpeed.mockResolvedValue({ success: true, speed: 4.5 });
    mockDecreaseSpeed.mockResolvedValue({ success: true, speed: 3.5 });
    mockCommandSpeed.mockResolvedValue(true);
    mockIncreaseIncline.mockResolvedValue({ success: true, incline: 5 });
    mockDecreaseIncline.mockResolvedValue({ success: true, incline: 3 });
    mockCommandIncline.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses the direct speed command for quick presets', async () => {
    const user = userEvent.setup();

    render(<SpeedControl />);

    await user.click(screen.getByRole('button', { name: '6' }));

    expect(mockCommandSpeed).toHaveBeenCalledWith(6);
  });

  it('disables the speed control while a command is in flight', async () => {
    const user = userEvent.setup();
    let resolveIncrease: (() => void) | undefined;

    mockIncreaseSpeed.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveIncrease = () => resolve({ success: true, speed: 4.5 });
        })
    );

    render(<SpeedControl />);

    const increaseButton = screen.getByRole('button', { name: 'Increase SPEED' });

    await user.click(increaseButton);

    await waitFor(() => {
      expect(increaseButton).toBeDisabled();
    });

    resolveIncrease?.();

    await waitFor(() => {
      expect(increaseButton).not.toBeDisabled();
    });
  });

  it('disables speed controls when the treadmill is disconnected', () => {
    setStoreState({ mqttConnected: false });

    render(<SpeedControl />);

    expect(screen.getByRole('button', { name: 'Increase SPEED' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease SPEED' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '6' })).toBeDisabled();
  });

  it('commands incline with the correct level for a higher quick preset', async () => {
    const user = userEvent.setup();

    render(<InclineControl />);

    await user.click(screen.getByRole('button', { name: '10' }));

    expect(mockCommandIncline).toHaveBeenCalledWith(10);
  });

  it('commands incline with the correct level for a lower quick preset', async () => {
    const user = userEvent.setup();

    render(<InclineControl />);

    await user.click(screen.getByRole('button', { name: '2' }));

    expect(mockCommandIncline).toHaveBeenCalledWith(2);
  });

  it('does not re-command incline for the active quick preset', async () => {
    const user = userEvent.setup();

    render(<InclineControl />);

    await user.click(screen.getByRole('button', { name: '4' }));

    expect(mockCommandIncline).not.toHaveBeenCalled();
  });

  it('renders the speed control and uses the correct command logic', async () => {
    const user = userEvent.setup();

    render(<SpeedControl />);

    expect(screen.getByText('SPEED')).toBeInTheDocument();
    expect(screen.getByText('KM/H')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '7' }));

    expect(mockCommandSpeed).toHaveBeenCalledWith(7);
  });

  it('renders the incline control and uses the correct command logic', async () => {
    const user = userEvent.setup();

    render(<InclineControl />);

    expect(screen.getByText('INCLINE')).toBeInTheDocument();
    expect(screen.getByText('GRADE %')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '10' }));

    expect(mockCommandIncline).toHaveBeenCalledWith(10);
  });

  describe('SpeedControl — cooldown cancellation on manual speed change', () => {
    it('calls setCooldownActive(false) when a speed preset is pressed during cooldown', async () => {
      const user = userEvent.setup();

      setStoreState({ cooldownActive: true });

      render(<SpeedControl />);

      await user.click(screen.getByRole('button', { name: '5' }));

      expect(mockSetCooldownActive).toHaveBeenCalledWith(false);
    });

    it('still executes the speed command after cancelling cooldown', async () => {
      const user = userEvent.setup();

      setStoreState({ cooldownActive: true });

      render(<SpeedControl />);

      await user.click(screen.getByRole('button', { name: '5' }));

      expect(mockCommandSpeed).toHaveBeenCalledWith(5);
    });

    it('does not restore pre-cooldown speed on manual speed change', async () => {
      const user = userEvent.setup();

      // speed is 4 (default); clicking 5 should call commandSpeed(5) exactly once — no restore
      setStoreState({ cooldownActive: true });

      render(<SpeedControl />);

      await user.click(screen.getByRole('button', { name: '5' }));

      expect(mockCommandSpeed).toHaveBeenCalledTimes(1);
      expect(mockCommandSpeed).toHaveBeenCalledWith(5);
    });
  });
});
