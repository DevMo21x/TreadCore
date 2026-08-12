import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSelectionPanel } from '@/components/UserSelectionPanel';
import { getAllUsers } from '@/lib/actions/user';

vi.mock('@/lib/actions/user', () => ({
  getAllUsers: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: React.PropsWithChildren<{ href: string; className?: string }>) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockedGetAllUsers = vi.mocked(getAllUsers);

describe('UserSelectionPanel', () => {
  beforeEach(() => {
    mockedGetAllUsers.mockResolvedValue(['alice', 'bob', 'eve adams']);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders filtered login suggestions and notifies selection', async () => {
    const handleSelectUser = vi.fn();
    const handleSwitchUser = vi.fn();
    const handleUsersLoaded = vi.fn();
    const user = userEvent.setup();

    render(
      <UserSelectionPanel
        stage="username"
        username="al"
        onSelectUser={handleSelectUser}
        onSwitchUser={handleSwitchUser}
        onUsersLoaded={handleUsersLoaded}
      />
    );

    const aliceButton = await screen.findByRole('button', { name: /@alice/i });

    expect(aliceButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /@bob/i })).not.toBeInTheDocument();
    expect(handleUsersLoaded).toHaveBeenCalledWith(['alice', 'bob', 'eve adams']);

    await user.click(aliceButton);

    expect(handleSelectUser).toHaveBeenCalledWith('alice');
    expect(handleSwitchUser).not.toHaveBeenCalled();
  });

  it('renders switch user state in login pin mode', async () => {
    const handleSelectUser = vi.fn();
    const handleSwitchUser = vi.fn();
    const user = userEvent.setup();

    render(
      <UserSelectionPanel
        stage="pin"
        username="alice"
        onSelectUser={handleSelectUser}
        onSwitchUser={handleSwitchUser}
      />
    );

    expect(await screen.findByText('Welcome, alice')).toBeInTheDocument();

    const switchUserButton = screen.getByRole('button', { name: /switch user/i });
    await user.click(switchUserButton);

    expect(handleSwitchUser).toHaveBeenCalledTimes(1);
    expect(handleSelectUser).not.toHaveBeenCalled();
  });

  it('renders quick-login links from fetched users', async () => {
    render(<UserSelectionPanel mode="quick-login" />);

    const aliceLink = await screen.findByRole('link', { name: /alice @alice/i });
    const encodedLink = await screen.findByRole('link', { name: /eve adams @eve adams/i });

    expect(screen.getByText('Quick Login')).toBeInTheDocument();
    expect(aliceLink).toHaveAttribute('href', '/login?user=alice');
    expect(encodedLink).toHaveAttribute('href', '/login?user=eve%20adams');
  });

  it('shows an empty state when the user fetch fails', async () => {
    mockedGetAllUsers.mockRejectedValueOnce(new Error('db error'));
    const handleUsersLoaded = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UserSelectionPanel
        stage="username"
        username=""
        onSelectUser={vi.fn()}
        onSwitchUser={vi.fn()}
        onUsersLoaded={handleUsersLoaded}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    expect(handleUsersLoaded).toHaveBeenCalledWith([]);

    consoleErrorSpy.mockRestore();
  });
});
