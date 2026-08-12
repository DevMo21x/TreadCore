import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditUsernameSection } from '@/components/profile/EditUsernameSection';
import { updateCurrentUsernameFormAction } from '@/lib/actions/user';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/actions/user', () => ({
  updateCurrentUsernameFormAction: vi.fn(),
}));

const refresh = vi.fn();
const back = vi.fn();
const forward = vi.fn();
const prefetch = vi.fn();
const push = vi.fn();
const replace = vi.fn();
const mockedUseRouter = vi.mocked(useRouter);
const mockedUpdateCurrentUsernameFormAction = vi.mocked(updateCurrentUsernameFormAction);

const mockRouter: AppRouterInstance = {
  back,
  forward,
  refresh,
  push,
  replace,
  prefetch,
};

// Open the edit form and wait until the input is ready for typing
async function openUsernameEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Edit Username' }));
  return screen.findByLabelText('New Username');
}

describe('EditUsernameSection', () => {
  beforeEach(() => {
    back.mockReset();
    forward.mockReset();
    prefetch.mockReset();
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue(mockRouter);
    mockedUpdateCurrentUsernameFormAction.mockReset();
    mockedUpdateCurrentUsernameFormAction.mockImplementation(async (_previousState, formData) => {
      if (formData.get('username') === 'takenname') {
        return {
          status: 'error',
          message: 'Username already exists',
        };
      }

      if (formData.get('username') === 'shittyuser') {
        return {
          status: 'error',
          message: 'Username contains inappropriate language.',
        };
      }

      return {
        status: 'success',
        message: 'Username updated successfully.',
        updatedUsername: String(formData.get('username')),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reveals and hides the edit form', async () => {
    const user = userEvent.setup();

    render(<EditUsernameSection username="runner7" />);

    await user.click(screen.getByRole('button', { name: 'Edit Username' }));

    expect(screen.getByLabelText('New Username')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('New Username')).not.toBeInTheDocument();
  });

  it('renders an inline error when the rename action fails', async () => {
    const user = userEvent.setup();

    render(<EditUsernameSection username="runner7" />);

    const input = await openUsernameEditor(user);

    // Use physical key events on the input so the test does not depend
    // on the on-screen keyboard layout or button rendering timing
    await user.click(input);
    for (
      let remainingCharacters = 'runner7'.length;
      remainingCharacters > 0;
      remainingCharacters -= 1
    ) {
      await user.keyboard('{Backspace}');
    }
    await user.keyboard('takenname');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('updates the visible username and refreshes the page after success', async () => {
    const user = userEvent.setup();

    render(<EditUsernameSection username="runner7" />);

    const input = await openUsernameEditor(user);

    // Use physical key events on the input so the test does not depend
    // on the on-screen keyboard layout or button rendering timing
    await user.click(input);
    for (
      let remainingCharacters = 'runner7'.length;
      remainingCharacters > 0;
      remainingCharacters -= 1
    ) {
      await user.keyboard('{Backspace}');
    }
    await user.keyboard('runnereight');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Username updated successfully.')).toBeInTheDocument();
      expect(screen.getByText('runnereight')).toBeInTheDocument();
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the profanity message inline when the rename action rejects the username', async () => {
    const user = userEvent.setup();

    render(<EditUsernameSection username="runner7" />);

    const input = await openUsernameEditor(user);

    await user.click(input);
    for (
      let remainingCharacters = 'runner7'.length;
      remainingCharacters > 0;
      remainingCharacters -= 1
    ) {
      await user.keyboard('{Backspace}');
    }
    await user.keyboard('shittyuser');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Username contains inappropriate language.')).toBeInTheDocument();
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});
