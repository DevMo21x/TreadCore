import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SignupPage from '@/app/(auth)/signup/page';
import { createUser, discardCurrentGuestAccount } from '@/lib/actions/user';
import { signIn, signOut } from 'next-auth/react';

const push = vi.fn();
const getSearchParam = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: getSearchParam,
  }),
}));

vi.mock('@/lib/actions/user', () => ({
  createUser: vi.fn(),
  discardCurrentGuestAccount: vi.fn(),
}));

const mockedCreateUser = vi.mocked(createUser);
const mockedDiscardCurrentGuestAccount = vi.mocked(discardCurrentGuestAccount);
const mockedSignIn = vi.mocked(signIn);
const mockedSignOut = vi.mocked(signOut);

describe('SignupPage', () => {
  beforeEach(() => {
    push.mockReset();
    getSearchParam.mockReset();
    mockedCreateUser.mockReset();
    mockedDiscardCurrentGuestAccount.mockReset();
    mockedSignIn.mockReset();
    mockedSignOut.mockReset();

    mockedSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: '/dashboard',
      code: undefined,
    });
    getSearchParam.mockReturnValue('promote');
    mockedDiscardCurrentGuestAccount.mockResolvedValue({
      id: 1,
      username: 'guest-session',
      role: 'guest',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the HyperGrid signup shell, guest banner, and keyboard styling', () => {
    const { container } = render(<SignupPage />);

    expect(container.querySelector('.hyper-grid-theme')).toBeInTheDocument();
    expect(container.querySelector('.hyper-grid-overlay')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(
      screen.getByText(/finish creating an account to keep the progress from this guest session/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/finish creating an account to keep the progress from this guest session/i)
    ).toHaveClass('border-[color:var(--hg-primary)]');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'border-[var(--hg-tertiary)]/38'
    );
    expect(screen.getByRole('button', { name: 'A' })).toHaveClass('glass-panel');
    expect(screen.getByRole('button', { name: 'A' })).toHaveClass('border-[var(--hg-border-soft)]');
  });

  it('shows tertiary validation errors and HyperGrid stage highlighting across the flow', async () => {
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.click(screen.getByRole('button', { name: 'Enter' }));

    const usernameError = screen.getByText('Username must be at least 3 characters');
    expect(usernameError).toHaveClass('text-(--hg-tertiary)');

    await user.click(screen.getByRole('button', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    const usernameInput = screen.getByLabelText('Create Username');
    const pinInput = screen.getByLabelText('Create PIN');
    expect(usernameInput.className).toContain('bg-[color:var(--hg-surface-high)]');
    expect(pinInput.className).toContain('bg-[color:var(--hg-surface)]');
    expect(screen.getByText('STEP 02')).toHaveClass('text-(--hg-primary)');
    expect(screen.getByText('STEP 01')).toHaveClass('text-[color:var(--hg-muted)]');
    expect(screen.getByText('@aaa')).toBeInTheDocument();
  });

  it('deletes the guest session when cancel is pressed from the first signup step', async () => {
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(mockedDiscardCurrentGuestAccount).toHaveBeenCalledTimes(1);
      expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    expect(push).not.toHaveBeenCalled();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('shows the discard error and stays on the page when guest cleanup fails', async () => {
    mockedDiscardCurrentGuestAccount.mockRejectedValueOnce(
      new Error('Something went wrong. Please try again later.')
    );
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again later.')).toBeInTheDocument();
    });

    expect(mockedSignOut).not.toHaveBeenCalled();
  });

  it('shows an inline error when signup rejects a profane username', async () => {
    mockedCreateUser.mockRejectedValueOnce(new Error('Username contains inappropriate language.'));
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.click(screen.getByRole('button', { name: 'S' }));
    await user.click(screen.getByRole('button', { name: 'H' }));
    await user.click(screen.getByRole('button', { name: 'I' }));
    await user.click(screen.getByRole('button', { name: 'T' }));
    await user.click(screen.getByRole('button', { name: 'T' }));
    await user.click(screen.getByRole('button', { name: 'Y' }));
    await user.click(screen.getByRole('button', { name: 'U' }));
    await user.click(screen.getByRole('button', { name: 'S' }));
    await user.click(screen.getByRole('button', { name: 'E' }));
    await user.click(screen.getByRole('button', { name: 'R' }));
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Username contains inappropriate language.')).toBeInTheDocument();
    });

    expect(mockedSignIn).not.toHaveBeenCalled();
  }, 15000);
});
