import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/(auth)/login/page';
import { signIn } from 'next-auth/react';

const push = vi.fn();
const getSearchParam = vi.fn();
const fetchMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: getSearchParam,
  }),
}));

vi.mock('@/components/UserSelectionPanel', () => ({
  UserSelectionPanel: ({ username, className }: { username: string; className?: string }) => (
    <div data-testid="user-selection-panel" data-class-name={className}>
      {username || 'No user selected'}
    </div>
  ),
}));

vi.mock('@/components/keyboard/KeyboardContainer', () => ({
  KeyboardContainer: ({
    mode,
    appearance,
    onKey,
    onEnter,
  }: {
    mode: 'username' | 'pin' | 'number';
    appearance?: 'default' | 'hyper-grid';
    onKey: (key: string) => void;
    onEnter: () => void;
  }) => (
    <div data-testid="keyboard-container" data-mode={mode} data-appearance={appearance}>
      <button type="button" onClick={() => onKey(mode === 'pin' ? '1' : 'a')}>
        Mock Key
      </button>
      <button type="button" onClick={() => void onEnter()}>
        Mock Enter
      </button>
    </div>
  ),
}));

const mockedSignIn = vi.mocked(signIn);

describe('LoginPage', () => {
  beforeEach(() => {
    push.mockReset();
    getSearchParam.mockReset();
    mockedSignIn.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the HyperGrid login shell with keyboard', () => {
    getSearchParam.mockReturnValue(null);
    const { container } = render(<LoginPage />);

    expect(container.querySelector('.hyper-grid-theme')).toBeInTheDocument();
    expect(container.querySelector('.hyper-grid-overlay')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByTestId('keyboard-container')).toHaveAttribute('data-mode', 'username');
    expect(screen.getByTestId('user-selection-panel')).toHaveAttribute(
      'data-class-name',
      'w-full min-w-0 self-stretch'
    );
  });

  it('shows a tertiary-styled invalid PIN error and a readable locked username field', async () => {
    getSearchParam.mockReturnValue('alice');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ locked: false, retryAfterSeconds: 0, remainingAttempts: 5 }),
    } as Response);
    mockedSignIn.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      status: 401,
      url: null,
      code: 'CredentialsSignin',
    });
    const user = userEvent.setup();

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('Username');
    expect(usernameInput).toHaveValue('alice');
    expect(usernameInput.className).toContain('bg-[color:var(--hg-surface-high)]');
    expect(screen.getByTestId('keyboard-container')).toHaveAttribute('data-mode', 'pin');

    await user.click(screen.getByRole('button', { name: 'Mock Key' }));
    await user.click(screen.getByRole('button', { name: 'Mock Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid PIN')).toBeInTheDocument();
    });

    expect(screen.getByText('Invalid PIN')).toHaveClass('text-(--hg-tertiary)');
    expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
      username: 'alice',
      pin: '1',
      redirect: false,
    });
  });
});
