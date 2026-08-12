import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signIn } from 'next-auth/react';
import { GuestSignInButton } from '@/components/auth/GuestSignInButton';

const push = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

const mockedSignIn = vi.mocked(signIn);

describe('GuestSignInButton', () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    push.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts a guest session and routes to the dashboard', async () => {
    mockedSignIn.mockResolvedValue({
      ok: true,
      error: undefined,
      status: 200,
      url: null,
      code: undefined,
    });
    const user = userEvent.setup();

    render(<GuestSignInButton />);

    await user.click(screen.getByRole('button', { name: /guest/i }));

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith('guest', { redirect: false });
      expect(push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows an error when the guest session cannot be started', async () => {
    mockedSignIn.mockResolvedValue({
      ok: false,
      error: 'AccessDenied',
      status: 401,
      url: null,
      code: 'AccessDenied',
    });
    const user = userEvent.setup();

    render(<GuestSignInButton />);

    await user.click(screen.getByRole('button', { name: /guest/i }));

    await waitFor(() => {
      expect(screen.getByText('Unable to start a guest session right now.')).toBeInTheDocument();
    });

    expect(push).not.toHaveBeenCalled();
  });
});
