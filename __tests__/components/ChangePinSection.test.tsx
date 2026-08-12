import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangePinSection } from '@/components/profile/ChangePinSection';
import { updateCurrentPinFormAction } from '@/lib/actions/user';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/actions/user', () => ({
  updateCurrentPinFormAction: vi.fn(),
}));

const refresh = vi.fn();
const back = vi.fn();
const forward = vi.fn();
const prefetch = vi.fn();
const push = vi.fn();
const replace = vi.fn();
const mockedUseRouter = vi.mocked(useRouter);
const mockedUpdateCurrentPinFormAction = vi.mocked(updateCurrentPinFormAction);

const mockRouter: AppRouterInstance = {
  back,
  forward,
  refresh,
  push,
  replace,
  prefetch,
};

function enterPin(user: ReturnType<typeof userEvent.setup>, value: string) {
  return value.split('').reduce(async (previousPromise, character) => {
    await previousPromise;
    await user.click(screen.getByRole('button', { name: character }));
  }, Promise.resolve());
}

describe('ChangePinSection', () => {
  beforeEach(() => {
    back.mockReset();
    forward.mockReset();
    prefetch.mockReset();
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue(mockRouter);
    mockedUpdateCurrentPinFormAction.mockReset();
    mockedUpdateCurrentPinFormAction.mockImplementation(async (_previousState, formData) => {
      const currentPin = String(formData.get('currentPin'));
      const newPin = String(formData.get('newPin'));
      const confirmPin = String(formData.get('confirmPin'));

      if (currentPin !== '1234') {
        return {
          status: 'error',
          message: 'Current PIN is incorrect',
        };
      }

      if (newPin !== confirmPin) {
        return {
          status: 'error',
          message: 'New PIN confirmation does not match',
        };
      }

      if (newPin === currentPin) {
        return {
          status: 'error',
          message: 'New PIN must be different from your current PIN',
        };
      }

      return {
        status: 'success',
        message: 'PIN updated successfully.',
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reveals and hides the change PIN form', async () => {
    const user = userEvent.setup();

    render(<ChangePinSection />);

    await user.click(screen.getByRole('button', { name: 'Change PIN' }));

    expect(screen.getByLabelText('Current PIN')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '*' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Current PIN')).not.toBeInTheDocument();
  });

  it('renders an inline error when the current PIN is incorrect', async () => {
    const user = userEvent.setup();

    render(<ChangePinSection />);

    await user.click(screen.getByRole('button', { name: 'Change PIN' }));
    await enterPin(user, '9999');
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await enterPin(user, '5678');
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await enterPin(user, '5678');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Current PIN is incorrect')).toBeInTheDocument();
    });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('submits successfully, collapses the form, and refreshes the page', async () => {
    const user = userEvent.setup();

    render(<ChangePinSection />);

    await user.click(screen.getByRole('button', { name: 'Change PIN' }));
    await enterPin(user, '1234');
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await enterPin(user, '5678');
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await enterPin(user, '5678');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('PIN updated successfully.')).toBeInTheDocument();
      expect(screen.queryByLabelText('Current PIN')).not.toBeInTheDocument();
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
