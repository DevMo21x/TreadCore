import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'next-auth/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { deleteCurrentUserAccountFormAction } from '@/lib/actions/user';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/lib/actions/user', () => ({
  deleteCurrentUserAccountFormAction: vi.fn(),
  initialDeleteCurrentUserAccountFormState: {
    status: 'idle',
    message: '',
  },
}));

const mockedDeleteCurrentUserAccountFormAction = vi.mocked(deleteCurrentUserAccountFormAction);
const mockedSignOut = vi.mocked(signOut);

async function typeViaKeyboard(user: ReturnType<typeof userEvent.setup>, text: string) {
  const keyboardContainer = screen.getByTestId('keyboard-container');
  for (const char of text) {
    const buttons = within(keyboardContainer).getAllByRole('button', { name: char.toUpperCase() });
    await user.click(buttons[0]);
  }
}

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    mockedDeleteCurrentUserAccountFormAction.mockReset();
    mockedSignOut.mockReset();
    mockedDeleteCurrentUserAccountFormAction.mockImplementation(
      async (_previousState, formData) => {
        if (formData.get('username') !== 'runner') {
          return {
            status: 'error',
            message: 'You can only delete your own account',
          };
        }

        return {
          status: 'success',
          message: 'Your account has been deleted. Redirecting to login...',
        };
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reveals and hides the confirmation form', async () => {
    const user = userEvent.setup();

    render(<DeleteAccountSection username="runner" />);

    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(screen.getByLabelText('Confirm Username')).toBeInTheDocument();

    const confirmationForm = screen.getByTestId('delete-account-confirmation-form');
    const cancelButton = within(confirmationForm).getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(screen.queryByLabelText('Confirm Username')).not.toBeInTheDocument();
  });

  it('renders an inline error when the delete action fails', async () => {
    const user = userEvent.setup();

    render(<DeleteAccountSection username="runner" />);

    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    await typeViaKeyboard(user, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));

    await waitFor(() => {
      expect(screen.getByText('You can only delete your own account')).toBeInTheDocument();
    });

    expect(mockedSignOut).not.toHaveBeenCalled();
  });

  it('clears client state and signs out after a successful deletion', async () => {
    const user = userEvent.setup();

    render(<DeleteAccountSection username="runner" />);

    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    await typeViaKeyboard(user, 'runner');
    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));

    await waitFor(() => {
      expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });
  });
});
