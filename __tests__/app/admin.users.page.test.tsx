import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AdminUsersPage from '@/app/admin/users/page';

const mockFetch = vi.fn();
const PAGE_SIZE = 8;
const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: mockUseSession,
}));

type MockUser = {
  createdAt: string;
  id: number;
  role: 'admin' | 'user';
  username: string;
};

type AdminUsersResponse = {
  items: MockUser[];
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageCount: number;
    pageSize: number;
  };
  summary: {
    adminCount: number;
    memberCount: number;
    totalUsers: number;
  };
};

async function enterPinWithKeypad(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const digit of pin) {
    await user.click(screen.getByRole('button', { name: digit }));
  }
}

async function enterUsernameSearchWithKeyboard(
  user: ReturnType<typeof userEvent.setup>,
  query: string
) {
  for (const character of query) {
    await user.click(screen.getByRole('button', { name: character.toUpperCase() }));
  }
}

function buildAdminUsersResponse(
  sourceUsers: MockUser[],
  page: number,
  pageSize: number,
  query = ''
): AdminUsersResponse {
  const normalizedQuery = query.toLowerCase();
  const filteredUsers =
    normalizedQuery.length > 0
      ? sourceUsers.filter((user) => user.username.toLowerCase().includes(normalizedQuery))
      : sourceUsers;
  const pageCount = filteredUsers.length > 0 ? Math.ceil(filteredUsers.length / pageSize) : 1;
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const items = filteredUsers.slice(offset, offset + pageSize);
  const adminCount = filteredUsers.filter((user) => user.role === 'admin').length;

  return {
    items,
    summary: {
      totalUsers: filteredUsers.length,
      adminCount,
      memberCount: filteredUsers.length - adminCount,
    },
    pagination: {
      currentPage,
      pageSize,
      pageCount,
      hasNextPage: currentPage < pageCount,
      hasPreviousPage: currentPage > 1,
    },
  };
}

function createResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('AdminUsersPage', () => {
  let users: MockUser[];

  beforeEach(() => {
    mockFetch.mockReset();
    mockUseSession.mockReset();

    users = [
      {
        id: 1,
        username: 'admin-user',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        username: 'member-user',
        role: 'user',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 3,
        username: 'member-3',
        role: 'user',
        createdAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 4,
        username: 'member-4',
        role: 'user',
        createdAt: '2026-01-04T00:00:00.000Z',
      },
      {
        id: 5,
        username: 'member-5',
        role: 'user',
        createdAt: '2026-01-05T00:00:00.000Z',
      },
      {
        id: 6,
        username: 'member-6',
        role: 'user',
        createdAt: '2026-01-06T00:00:00.000Z',
      },
      {
        id: 7,
        username: 'member-7',
        role: 'user',
        createdAt: '2026-01-07T00:00:00.000Z',
      },
      {
        id: 8,
        username: 'member-8',
        role: 'user',
        createdAt: '2026-01-08T00:00:00.000Z',
      },
      {
        id: 9,
        username: 'member-9',
        role: 'user',
        createdAt: '2026-01-09T00:00:00.000Z',
      },
    ];

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          role: 'admin',
          username: 'admin-user',
        },
      },
      status: 'authenticated',
    });

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';
      const parsedUrl = new URL(url, 'http://localhost');

      if (parsedUrl.pathname === '/api/admin/users' && method === 'GET') {
        const page = Number.parseInt(parsedUrl.searchParams.get('page') ?? '1', 10) || 1;
        const pageSize =
          Number.parseInt(parsedUrl.searchParams.get('pageSize') ?? String(PAGE_SIZE), 10) ||
          PAGE_SIZE;
        const query = parsedUrl.searchParams.get('query') ?? '';

        return createResponse(200, buildAdminUsersResponse(users, page, pageSize, query));
      }

      if (url === '/api/admin/users/2' && method === 'PATCH') {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          pin?: string;
          role?: 'admin' | 'user';
        };

        if (body.role) {
          const nextRole = body.role;

          users = users.map((user) => (user.id === 2 ? { ...user, role: nextRole } : user));

          return createResponse(200, {
            id: 2,
            username: 'member-user',
            role: nextRole,
          });
        }

        if (body.pin) {
          return createResponse(200, {
            id: 2,
            username: 'member-user',
            role: users.find((user) => user.id === 2)?.role ?? 'user',
          });
        }
      }

      if (url === '/api/admin/users/2' && method === 'DELETE') {
        users = users.filter((user) => user.id !== 2);

        return createResponse(200, {
          id: 2,
          username: 'member-user',
          role: 'user',
        });
      }

      return createResponse(500, { error: 'Unhandled request in test.' });
    });

    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders users and disables self-management actions', async () => {
    render(<AdminUsersPage />);

    const adminUserCell = await screen.findByText('admin-user');
    const memberUserCell = await screen.findByText('member-user');

    expect(adminUserCell).toBeInTheDocument();
    expect(memberUserCell).toBeInTheDocument();

    const adminRow = adminUserCell.closest('tr');
    expect(adminRow).not.toBeNull();

    if (!adminRow) {
      return;
    }

    expect(within(adminRow).getByRole('button', { name: 'Current Admin' })).toBeDisabled();
    expect(within(adminRow).getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(within(adminRow).getByRole('button', { name: 'Reset PIN' })).not.toBeDisabled();
    expect(screen.getByText('Showing 1-8 of 9 users')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('fetches the next page from the API when the pagination panel is used', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    await screen.findByText('member-user');
    await user.click(screen.getByRole('button', { name: 'Next Page' }));

    await waitFor(() => {
      expect(screen.getByText('member-9')).toBeInTheDocument();
      expect(screen.queryByText('member-user')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 9-9 of 9 users')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    const pageTwoCalls = mockFetch.mock.calls.filter(
      ([url, init]) => url === `/api/admin/users?page=2&pageSize=${PAGE_SIZE}` && !init?.method
    );

    expect(pageTwoCalls).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Previous Page' })).not.toBeDisabled();
  });

  it('opens the search modal and filters usernames with the built-in keyboard', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    await screen.findByText('member-user');
    await user.click(screen.getByRole('button', { name: 'Search Users' }));

    const searchDialog = screen.getByRole('dialog');
    expect(searchDialog).toHaveClass('glass-panel');
    expect(searchDialog).toHaveClass('border-[color:var(--hg-border-soft)]');

    const searchInput = screen.getByLabelText('Username Search');
    expect(searchInput).toHaveAttribute('inputmode', 'none');
    expect(searchInput).toHaveAttribute('readonly');
    expect(searchInput).toHaveClass('bg-[var(--hg-surface-soft)]');
    expect(searchInput).toHaveClass('border-[color:var(--hg-border-soft)]');

    await enterUsernameSearchWithKeyboard(user, 'admin');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('admin-user')).toBeInTheDocument();
      expect(screen.queryByText('member-user')).not.toBeInTheDocument();
      expect(screen.getByText('Search: admin')).toBeInTheDocument();
      expect(screen.getByText('Showing 1-1 of 1 matching users')).toBeInTheDocument();
    });

    const searchCalls = mockFetch.mock.calls.filter(
      ([url, init]) =>
        url === `/api/admin/users?page=1&pageSize=${PAGE_SIZE}&query=admin` && !init?.method
    );

    expect(searchCalls).toHaveLength(1);
  }, 15000);

  it('shows the error banner and empty state when loading users fails', async () => {
    mockFetch.mockResolvedValueOnce(
      createResponse(500, { error: 'Unable to load users from server.' })
    );

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load users from server.')).toBeInTheDocument();
      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });
  });

  it('clears an active search and resets back to page 1 before refetching', async () => {
    const user = userEvent.setup();

    users = [
      ...users,
      {
        id: 10,
        username: 'member-ten',
        role: 'user',
        createdAt: '2026-01-10T00:00:00.000Z',
      },
    ];

    render(<AdminUsersPage />);

    await screen.findByText('member-user');
    await user.click(screen.getByRole('button', { name: 'Search Users' }));
    await enterUsernameSearchWithKeyboard(user, 'member');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('Search: member')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Next Page' }));

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clear Search' }));

    await waitFor(() => {
      expect(screen.queryByText('Search: member')).not.toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('admin-user')).toBeInTheDocument();
    });

    const getRequestUrls = mockFetch.mock.calls
      .filter(([, init]) => !init?.method)
      .map(([url]) => url);

    expect(getRequestUrls.at(-1)).toBe(`/api/admin/users?page=1&pageSize=${PAGE_SIZE}`);
  }, 15000);

  it('updates the role in local state after a successful promote action', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    const memberUserCell = await screen.findByText('member-user');
    const memberRow = memberUserCell.closest('tr');
    expect(memberRow).not.toBeNull();

    if (!memberRow) {
      return;
    }

    await user.click(within(memberRow).getByRole('button', { name: 'Promote to Admin' }));

    await waitFor(() => {
      expect(screen.getByText('member-user was promoted to admin.')).toBeInTheDocument();
      expect(within(memberRow).getByRole('button', { name: 'Demote to User' })).toBeInTheDocument();
    });
  });

  it('blocks invalid PIN submission on the client before sending a request', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    const memberUserCell = await screen.findByText('member-user');
    const memberRow = memberUserCell.closest('tr');
    expect(memberRow).not.toBeNull();

    if (!memberRow) {
      return;
    }

    await user.click(within(memberRow).getByRole('button', { name: 'Reset PIN' }));

    const pinInput = screen.getByLabelText('New PIN');
    expect(pinInput).toHaveAttribute('inputmode', 'none');
    expect(pinInput).toHaveAttribute('readonly');

    await enterPinWithKeypad(user, '12');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    expect(screen.getByText('PIN must be 4–32 digits.')).toBeInTheDocument();

    const patchCalls = mockFetch.mock.calls.filter(
      ([url, init]) => url === '/api/admin/users/2' && init?.method === 'PATCH'
    );

    expect(patchCalls).toHaveLength(0);
  });

  it('submits a valid PIN reset and closes the dialog on success', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    const memberUserCell = await screen.findByText('member-user');
    const memberRow = memberUserCell.closest('tr');
    expect(memberRow).not.toBeNull();

    if (!memberRow) {
      return;
    }

    await user.click(within(memberRow).getByRole('button', { name: 'Reset PIN' }));
    await enterPinWithKeypad(user, '1234');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => {
      expect(screen.getByText('PIN reset for member-user.')).toBeInTheDocument();
      expect(screen.queryByText('Reset PIN for member-user')).not.toBeInTheDocument();
    });
  }, 15000);

  it('removes a user from the table after a confirmed delete', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    const memberUserCell = await screen.findByText('member-user');
    const memberRow = memberUserCell.closest('tr');
    expect(memberRow).not.toBeNull();

    if (!memberRow) {
      return;
    }

    await user.click(within(memberRow).getByRole('button', { name: 'Delete' }));

    const deleteDialog = screen.getByRole('dialog');
    expect(deleteDialog).toHaveClass('glass-panel');
    expect(deleteDialog).toHaveClass('rounded-2xl');
    expect(deleteDialog).toHaveClass('border-[color:var(--hg-border-soft)]');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('bg-white/5');
    expect(screen.getByRole('button', { name: 'Confirm Delete' })).toHaveClass(
      'bg-[color:var(--hg-secondary)]'
    );

    await user.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    await waitFor(() => {
      expect(screen.getByText('member-user was deleted.')).toBeInTheDocument();
      expect(screen.queryByText('member-user')).not.toBeInTheDocument();
    });
  });
});
