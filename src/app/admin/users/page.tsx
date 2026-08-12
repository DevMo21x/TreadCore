'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { PIN_MAX_LENGTH, isPinCharacter, pinSchema } from '@/lib/users/pinValidation';
import { normalizeUsername, USERNAME_MAX_LENGTH } from '@/lib/users/usernameValidation';
import { AdminTouchKeyboard } from './AdminTouchKeyboard';

const ADMIN_USERS_PAGE_SIZE = 8;

type AdminUserRole = 'admin' | 'user';

type AdminUser = {
  id: number;
  username: string;
  role: AdminUserRole;
  createdAt: string;
};

type PinDialogState = {
  error: string;
  pin: string;
  user: AdminUser;
};

type SearchDialogState = {
  query: string;
};

type DeleteDialogState = {
  user: AdminUser;
};

type PendingAction = {
  type: 'delete' | 'pin' | 'role';
  userId: number;
} | null;

type AdminUsersSummary = {
  totalUsers: number;
  adminCount: number;
  memberCount: number;
};

type AdminUsersPagination = {
  currentPage: number;
  pageSize: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AdminUsersPageResponse = {
  items: AdminUser[];
  summary: AdminUsersSummary;
  pagination: AdminUsersPagination;
};

const EMPTY_ADMIN_USERS_SUMMARY: AdminUsersSummary = {
  totalUsers: 0,
  adminCount: 0,
  memberCount: 0,
};

const SEARCH_QUERY_CHARACTER_PATTERN = /^[a-zA-Z]$/;

function createPaginationState(currentPage = 1): AdminUsersPagination {
  return {
    currentPage,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    pageCount: 1,
    hasNextPage: false,
    hasPreviousPage: currentPage > 1,
  };
}

function isSearchQueryCharacter(key: string) {
  return SEARCH_QUERY_CHARACTER_PATTERN.test(key);
}

function buildAdminUsersRequestUrl(page: number, query: string) {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(ADMIN_USERS_PAGE_SIZE),
  });

  if (query.length > 0) {
    searchParams.set('query', query);
  }

  return `/api/admin/users?${searchParams.toString()}`;
}

function normalizeAdminUsersResponse(body: unknown, fallbackPage: number): AdminUsersPageResponse {
  const bodyRecord = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  const items = Array.isArray(bodyRecord?.items) ? (bodyRecord.items as AdminUser[]) : [];

  const fallbackAdminCount = items.filter((user) => user.role === 'admin').length;
  const summaryRecord =
    bodyRecord?.summary && typeof bodyRecord.summary === 'object'
      ? (bodyRecord.summary as Record<string, unknown>)
      : null;
  const totalUsers =
    typeof summaryRecord?.totalUsers === 'number' ? summaryRecord.totalUsers : items.length;
  const adminCount =
    typeof summaryRecord?.adminCount === 'number' ? summaryRecord.adminCount : fallbackAdminCount;
  const memberCount =
    typeof summaryRecord?.memberCount === 'number'
      ? summaryRecord.memberCount
      : Math.max(totalUsers - adminCount, 0);

  const paginationRecord =
    bodyRecord?.pagination && typeof bodyRecord.pagination === 'object'
      ? (bodyRecord.pagination as Record<string, unknown>)
      : null;
  const currentPage =
    typeof paginationRecord?.currentPage === 'number' && paginationRecord.currentPage > 0
      ? paginationRecord.currentPage
      : fallbackPage;
  const pageSize =
    typeof paginationRecord?.pageSize === 'number' && paginationRecord.pageSize > 0
      ? paginationRecord.pageSize
      : ADMIN_USERS_PAGE_SIZE;
  const pageCount =
    typeof paginationRecord?.pageCount === 'number' && paginationRecord.pageCount > 0
      ? paginationRecord.pageCount
      : totalUsers > 0
        ? Math.ceil(totalUsers / pageSize)
        : 1;
  const hasNextPage =
    typeof paginationRecord?.hasNextPage === 'boolean'
      ? paginationRecord.hasNextPage
      : currentPage < pageCount;
  const hasPreviousPage =
    typeof paginationRecord?.hasPreviousPage === 'boolean'
      ? paginationRecord.hasPreviousPage
      : currentPage > 1;

  return {
    items,
    summary: {
      totalUsers,
      adminCount,
      memberCount,
    },
    pagination: {
      currentPage,
      pageSize,
      pageCount,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function buildErrorMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string' &&
    body.error.length > 0
  ) {
    return body.error;
  }

  return fallback;
}

function isAbortError(error: unknown) {
  return !!error && typeof error === 'object' && 'name' in error && error.name === 'AbortError';
}

function RoleBadge({ role }: Readonly<{ role: AdminUserRole }>) {
  const badgeClassName =
    role === 'admin'
      ? 'border-[rgba(208,188,255,0.45)] bg-[rgba(208,188,255,0.16)] text-[var(--hg-primary)]'
      : 'border-[rgba(0,227,253,0.35)] bg-[rgba(0,227,253,0.12)] text-[var(--hg-secondary)]';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${badgeClassName}`}
    >
      {role}
    </span>
  );
}

function ActionButton({
  children,
  disabled = false,
  onClick,
  tone = 'neutral',
  type = 'button',
}: Readonly<{
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: 'danger' | 'neutral' | 'primary';
  type?: 'button' | 'submit';
}>) {
  const toneClassName =
    tone === 'danger'
      ? 'border-[rgba(255,178,186,0.35)] bg-[rgba(255,178,186,0.12)] text-[var(--hg-tertiary)] hover:bg-[rgba(255,178,186,0.2)]'
      : tone === 'primary'
        ? 'border-[rgba(0,227,253,0.35)] bg-[rgba(0,227,253,0.12)] text-[var(--hg-secondary)] hover:bg-[rgba(0,227,253,0.2)]'
        : 'border-[rgba(208,188,255,0.35)] bg-[rgba(208,188,255,0.12)] text-[var(--hg-primary)] hover:bg-[rgba(208,188,255,0.2)]';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function PaginationButton({
  children,
  disabled = false,
  onClick,
  tone = 'primary',
}: Readonly<{
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tone?: 'primary' | 'secondary';
}>) {
  const toneClassName =
    tone === 'secondary'
      ? 'border-[rgba(0,227,253,0.35)] bg-[rgba(0,227,253,0.12)] text-[var(--hg-secondary)] hover:bg-[rgba(0,227,253,0.2)]'
      : 'border-[rgba(208,188,255,0.35)] bg-[rgba(208,188,255,0.12)] text-[var(--hg-primary)] hover:bg-[rgba(208,188,255,0.2)]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-16 min-w-48 items-center justify-center rounded-2xl border px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>(EMPTY_ADMIN_USERS_SUMMARY);
  const [pagination, setPagination] = useState<AdminUsersPagination>(() => createPaginationState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRefreshToken, setPageRefreshToken] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialog, setSearchDialog] = useState<SearchDialogState | null>(null);
  const [pinDialog, setPinDialog] = useState<PinDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);

  const currentUserId = Number.parseInt(session?.user?.id ?? '', 10);
  const isSearchActive = searchQuery.length > 0;
  const pageStart =
    users.length === 0 ? 0 : (pagination.currentPage - 1) * ADMIN_USERS_PAGE_SIZE + 1;
  const pageEnd = pageStart === 0 ? 0 : pageStart + users.length - 1;
  const isInitialLoading = loading && users.length === 0;
  const isPageTransitioning = loading && users.length > 0;

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(buildAdminUsersRequestUrl(currentPage, searchQuery), {
          cache: 'no-store',
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          setUsers([]);
          setSummary(EMPTY_ADMIN_USERS_SUMMARY);
          setPagination(createPaginationState(currentPage));
          setError(buildErrorMessage(body, 'Unable to load users right now.'));
          return;
        }

        const normalizedResponse = normalizeAdminUsersResponse(body, currentPage);

        setUsers(normalizedResponse.items);
        setSummary(normalizedResponse.summary);
        setPagination(normalizedResponse.pagination);

        if (normalizedResponse.pagination.currentPage !== currentPage) {
          setCurrentPage(normalizedResponse.pagination.currentPage);
        }
      } catch (fetchError) {
        if (isAbortError(fetchError)) {
          return;
        }

        setUsers([]);
        setSummary(EMPTY_ADMIN_USERS_SUMMARY);
        setPagination(createPaginationState(currentPage));
        setError('Unable to load users right now.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      controller.abort();
    };
  }, [currentPage, pageRefreshToken, searchQuery]);

  function isCurrentUser(user: AdminUser) {
    return Number.isInteger(currentUserId) && currentUserId === user.id;
  }

  function clearFeedback() {
    setError('');
    setSuccess('');
  }

  function appendPinDigit(key: string) {
    if (!pinDialog || pendingAction?.type === 'pin' || !isPinCharacter(key)) {
      return;
    }

    setPinDialog((currentDialog) =>
      currentDialog
        ? {
            ...currentDialog,
            error: '',
            pin: `${currentDialog.pin}${key}`.slice(0, PIN_MAX_LENGTH),
          }
        : currentDialog
    );
  }

  function removePinDigit() {
    if (!pinDialog || pendingAction?.type === 'pin') {
      return;
    }

    setPinDialog((currentDialog) =>
      currentDialog
        ? {
            ...currentDialog,
            error: '',
            pin: currentDialog.pin.slice(0, -1),
          }
        : currentDialog
    );
  }

  function openSearchDialog() {
    clearFeedback();
    setSearchDialog({ query: searchQuery });
  }

  function closeSearchDialog() {
    setSearchDialog(null);
  }

  function appendSearchCharacter(key: string) {
    if (!searchDialog || !isSearchQueryCharacter(key)) {
      return;
    }

    setSearchDialog((currentDialog) =>
      currentDialog
        ? {
            ...currentDialog,
            query: `${currentDialog.query}${key}`.slice(0, USERNAME_MAX_LENGTH),
          }
        : currentDialog
    );
  }

  function removeSearchCharacter() {
    if (!searchDialog) {
      return;
    }

    setSearchDialog((currentDialog) =>
      currentDialog
        ? {
            ...currentDialog,
            query: currentDialog.query.slice(0, -1),
          }
        : currentDialog
    );
  }

  function applySearch() {
    if (!searchDialog) {
      return;
    }

    const normalizedSearchQuery = normalizeUsername(searchDialog.query).slice(
      0,
      USERNAME_MAX_LENGTH
    );

    clearFeedback();
    setSearchDialog(null);

    if (normalizedSearchQuery !== searchQuery) {
      setSearchQuery(normalizedSearchQuery);
    }

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }

  function clearSearch() {
    if (!isSearchActive) {
      return;
    }

    clearFeedback();
    setSearchQuery('');
    setCurrentPage(1);
  }

  function handlePinFieldKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      removePinDigit();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      void handlePinReset();
      return;
    }

    if (event.key.length === 1 && isPinCharacter(event.key)) {
      event.preventDefault();
      appendPinDigit(event.key);
    }
  }

  function handleSearchFieldKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      removeSearchCharacter();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      applySearch();
      return;
    }

    if (event.key.length === 1 && isSearchQueryCharacter(event.key)) {
      event.preventDefault();
      appendSearchCharacter(event.key);
    }
  }

  function openPinDialog(user: AdminUser) {
    clearFeedback();
    setPinDialog({ error: '', pin: '', user });
  }

  function closePinDialog() {
    if (pendingAction?.type === 'pin') {
      return;
    }

    setPinDialog(null);
  }

  function openDeleteDialog(user: AdminUser) {
    clearFeedback();
    setDeleteDialog({ user });
  }

  function closeDeleteDialog() {
    if (pendingAction?.type === 'delete') {
      return;
    }

    setDeleteDialog(null);
  }

  function updateUserInState(updatedUser: { id: number; role: AdminUserRole; username: string }) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === updatedUser.id
          ? { ...user, role: updatedUser.role, username: updatedUser.username }
          : user
      )
    );
  }

  async function handleRoleToggle(user: AdminUser) {
    if (isCurrentUser(user)) {
      return;
    }

    const nextRole: AdminUserRole = user.role === 'admin' ? 'user' : 'admin';
    clearFeedback();
    setPendingAction({ type: 'role', userId: user.id });

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(buildErrorMessage(body, 'Unable to update user role.'));
        return;
      }

      updateUserInState(body as { id: number; role: AdminUserRole; username: string });
      setSummary((currentSummary) =>
        nextRole === 'admin'
          ? {
              ...currentSummary,
              adminCount: currentSummary.adminCount + 1,
              memberCount: Math.max(currentSummary.memberCount - 1, 0),
            }
          : {
              ...currentSummary,
              adminCount: Math.max(currentSummary.adminCount - 1, 0),
              memberCount: currentSummary.memberCount + 1,
            }
      );
      setSuccess(
        nextRole === 'admin'
          ? `${user.username} was promoted to admin.`
          : `${user.username} was demoted to user.`
      );
    } catch {
      setError('Unable to update user role.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePinReset() {
    if (!pinDialog || pendingAction?.type === 'pin') {
      return;
    }

    const parsedPin = pinSchema.safeParse(pinDialog.pin);
    if (!parsedPin.success) {
      setPinDialog((currentDialog) =>
        currentDialog ? { ...currentDialog, error: 'PIN must be 4–32 digits.' } : currentDialog
      );
      return;
    }

    clearFeedback();
    setPendingAction({ type: 'pin', userId: pinDialog.user.id });

    try {
      const response = await fetch(`/api/admin/users/${pinDialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: parsedPin.data }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setPinDialog((currentDialog) =>
          currentDialog
            ? { ...currentDialog, error: buildErrorMessage(body, 'Unable to reset user PIN.') }
            : currentDialog
        );
        return;
      }

      setSuccess(`PIN reset for ${pinDialog.user.username}.`);
      setPinDialog(null);
    } catch {
      setPinDialog((currentDialog) =>
        currentDialog ? { ...currentDialog, error: 'Unable to reset user PIN.' } : currentDialog
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (!deleteDialog) {
      return;
    }

    const deletedUser = deleteDialog.user;
    const shouldStepBackAfterDelete = users.length === 1 && currentPage > 1;

    clearFeedback();
    setPendingAction({ type: 'delete', userId: deletedUser.id });

    try {
      const response = await fetch(`/api/admin/users/${deletedUser.id}`, {
        method: 'DELETE',
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(buildErrorMessage(body, 'Unable to delete user.'));
        return;
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== deletedUser.id));
      setSummary((currentSummary) => ({
        totalUsers: Math.max(currentSummary.totalUsers - 1, 0),
        adminCount:
          deletedUser.role === 'admin'
            ? Math.max(currentSummary.adminCount - 1, 0)
            : currentSummary.adminCount,
        memberCount:
          deletedUser.role === 'user'
            ? Math.max(currentSummary.memberCount - 1, 0)
            : currentSummary.memberCount,
      }));
      setSuccess(`${deletedUser.username} was deleted.`);
      setDeleteDialog(null);

      if (shouldStepBackAfterDelete) {
        setCurrentPage((page) => Math.max(page - 1, 1));
      } else {
        setPageRefreshToken((token) => token + 1);
      }
    } catch {
      setError('Unable to delete user.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="glass-panel rounded-[28px] px-6 py-8 md:px-8">
        <p className="text-(--hg-secondary) text-[11px] font-bold tracking-[0.28em]">
          USER MANAGEMENT
        </p>
        <h1 className="text-(--hg-text) mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          Manage access and account safety
        </h1>
        <p className="text-(--hg-muted) mt-3 max-w-3xl text-sm leading-6 md:text-base">
          Review member accounts, promote trusted users, reset PINs, and remove access when needed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-3xl px-5 py-5">
          <p className="text-(--hg-muted) text-[11px] font-bold tracking-[0.18em]">TOTAL USERS</p>
          <p className="text-(--hg-text) mt-3 text-3xl font-semibold">{summary.totalUsers}</p>
        </div>
        <div className="glass-panel rounded-3xl px-5 py-5">
          <p className="text-(--hg-muted) text-[11px] font-bold tracking-[0.18em]">ADMINS</p>
          <p className="text-(--hg-primary) mt-3 text-3xl font-semibold">{summary.adminCount}</p>
        </div>
        <div className="glass-panel rounded-3xl px-5 py-5">
          <p className="text-(--hg-muted) text-[11px] font-bold tracking-[0.18em]">MEMBERS</p>
          <p className="text-(--hg-secondary) mt-3 text-3xl font-semibold">{summary.memberCount}</p>
        </div>
      </div>

      {error ? (
        <div className="text-(--hg-tertiary) rounded-[20px] border border-[rgba(255,178,186,0.3)] bg-[rgba(255,178,186,0.12)] px-5 py-4 text-sm">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="text-(--hg-secondary) rounded-[20px] border border-[rgba(0,227,253,0.25)] bg-[rgba(0,227,253,0.12)] px-5 py-4 text-sm">
          {success}
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden rounded-[28px]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-(--hg-text) text-xl font-semibold tracking-[-0.02em]">
              User accounts
            </h2>
            <p className="text-(--hg-muted) mt-2 text-sm leading-6">
              Guests are excluded from this list. Self-demotion and self-deletion are blocked.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {isSearchActive ? (
              <div className="text-(--hg-secondary) inline-flex min-h-14 items-center justify-center rounded-2xl border border-[rgba(0,227,253,0.25)] bg-[rgba(0,227,253,0.1)] px-5 py-3 text-sm font-bold tracking-[0.08em]">
                {`Search: ${searchQuery}`}
              </div>
            ) : null}
            {isSearchActive ? (
              <ActionButton onClick={clearSearch}>Clear Search</ActionButton>
            ) : null}
            <PaginationButton tone="secondary" onClick={openSearchDialog}>
              Search Users
            </PaginationButton>
          </div>
        </div>

        {isInitialLoading ? (
          <div className="text-(--hg-muted) px-6 py-16 text-center text-sm">
            Loading user accounts…
          </div>
        ) : users.length === 0 ? (
          <div className="text-(--hg-muted) px-6 py-16 text-center text-sm">
            {isSearchActive ? `No users found for "${searchQuery}".` : 'No users found.'}
          </div>
        ) : (
          <div className="relative">
            <div
              className={`overflow-x-auto transition-opacity ${
                isPageTransitioning ? 'pointer-events-none opacity-50' : 'opacity-100'
              }`}
            >
              <table className="min-w-full border-collapse text-left">
                <thead className="text-(--hg-muted) bg-white/5 text-[11px] font-bold uppercase tracking-[0.16em]">
                  <tr>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const busyForRow = pendingAction?.userId === user.id;
                    const currentUser = isCurrentUser(user);

                    return (
                      <tr
                        key={user.id}
                        className="border-t border-white/10 align-top hover:bg-white/5"
                      >
                        <td className="px-6 py-5">
                          <div className="text-(--hg-text) font-semibold">{user.username}</div>
                          <div className="text-(--hg-muted) mt-1 text-xs">ID {user.id}</div>
                        </td>
                        <td className="px-6 py-5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="text-(--hg-muted) px-6 py-5 text-sm">
                          {formatCreatedAt(user.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              disabled={!!pendingAction}
                              onClick={() => openPinDialog(user)}
                            >
                              {busyForRow && pendingAction?.type === 'pin'
                                ? 'Resetting…'
                                : 'Reset PIN'}
                            </ActionButton>
                            <ActionButton
                              tone="primary"
                              disabled={!!pendingAction || currentUser}
                              onClick={() => handleRoleToggle(user)}
                            >
                              {currentUser
                                ? 'Current Admin'
                                : busyForRow && pendingAction?.type === 'role'
                                  ? 'Saving…'
                                  : user.role === 'admin'
                                    ? 'Demote to User'
                                    : 'Promote to Admin'}
                            </ActionButton>
                            <ActionButton
                              tone="danger"
                              disabled={!!pendingAction || currentUser}
                              onClick={() => openDeleteDialog(user)}
                            >
                              {busyForRow && pendingAction?.type === 'delete'
                                ? 'Deleting…'
                                : 'Delete'}
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isPageTransitioning ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(19,19,19,0.18)]">
                <div className="text-(--hg-secondary) rounded-full border border-[rgba(0,227,253,0.25)] bg-[rgba(16,16,16,0.92)] px-5 py-3 text-sm font-bold tracking-[0.12em] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                  Updating list…
                </div>
              </div>
            ) : null}
          </div>
        )}

        {!loading && summary.totalUsers > 0 ? (
          <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-(--hg-muted) text-[11px] font-bold tracking-[0.18em]">
                PAGINATION
              </p>
              <p className="text-(--hg-text) mt-2 text-sm leading-6 md:text-base">
                Showing {pageStart}-{pageEnd} of {summary.totalUsers}{' '}
                {isSearchActive ? 'matching users' : 'users'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <PaginationButton
                disabled={loading || !pagination.hasPreviousPage}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              >
                Previous Page
              </PaginationButton>
              <div className="text-(--hg-text) inline-flex min-h-16 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(19,19,19,0.72)] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                {`Page ${pagination.currentPage} of ${pagination.pageCount}`}
              </div>
              <PaginationButton
                tone="secondary"
                disabled={loading || !pagination.hasNextPage}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next Page
              </PaginationButton>
            </div>
          </div>
        ) : null}
      </div>

      {searchDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-users-title"
            className="glass-panel w-full max-w-5xl rounded-2xl border border-[color:var(--hg-border-soft)] px-6 py-6 md:px-8"
          >
            <div className="border-b border-[color:var(--hg-border-soft)] pb-5">
              <p className="text-(--hg-secondary) text-[11px] font-bold tracking-[0.24em]">
                SEARCH USERS
              </p>
              <h2 id="search-users-title" className="text-(--hg-text) mt-3 text-2xl font-semibold">
                Find a username
              </h2>
              <p className="text-(--hg-muted) mt-3 text-sm leading-6">
                Enter a full username or partial match using the built-in keyboard below.
              </p>
            </div>

            <div className="pt-5">
              <label className="text-(--hg-muted) block text-[11px] font-bold uppercase tracking-[0.16em]">
                Username Search
                <input
                  type="text"
                  inputMode="none"
                  readOnly
                  value={searchDialog.query}
                  onKeyDown={handleSearchFieldKeyDown}
                  className="mt-3 w-full rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-3 text-base text-[var(--hg-text)] outline-none transition placeholder:text-[var(--hg-muted)] focus:ring-2 focus:ring-[var(--hg-secondary)]"
                />
              </label>

              <p className="text-(--hg-muted) mt-3 text-sm leading-6">
                Use letters only. Back removes the last character. Leave the field empty and press
                Enter to show all users.
              </p>

              <div className="mt-6">
                <AdminTouchKeyboard
                  mode="username"
                  onKey={appendSearchCharacter}
                  onBackspace={removeSearchCharacter}
                  onCancel={closeSearchDialog}
                  onEnter={applySearch}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pinDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-pin-title"
            className="glass-panel w-full max-w-2xl rounded-2xl border border-[color:var(--hg-border-soft)] px-6 py-6 md:px-8"
          >
            <div className="border-b border-[color:var(--hg-border-soft)] pb-5">
              <p className="text-(--hg-secondary) text-[11px] font-bold tracking-[0.24em]">
                RESET PIN
              </p>
              <h2 id="reset-pin-title" className="text-(--hg-text) mt-3 text-2xl font-semibold">
                Reset PIN for {pinDialog.user.username}
              </h2>
              <p className="text-(--hg-muted) mt-3 text-sm leading-6">
                Enter a new PIN between 4 and 32 digits using the built-in keypad below.
              </p>
            </div>

            <div className="pt-5">
              <label className="text-(--hg-muted) block text-[11px] font-bold uppercase tracking-[0.16em]">
                New PIN
                <input
                  type="password"
                  inputMode="none"
                  readOnly
                  value={pinDialog.pin}
                  onKeyDown={handlePinFieldKeyDown}
                  className="mt-3 w-full rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-3 text-base tracking-[0.3em] text-[var(--hg-text)] outline-none transition placeholder:text-[var(--hg-muted)] focus:ring-2 focus:ring-[var(--hg-secondary)]"
                />
              </label>

              <p className="text-(--hg-muted) mt-3 text-sm leading-6">
                Use Back to delete the last digit, Cancel to close, and Enter to confirm the reset.
              </p>

              {pinDialog.error ? (
                <p className="mt-4 rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 text-sm text-red-400">
                  {pinDialog.error}
                </p>
              ) : null}

              <div className="mt-6">
                <AdminTouchKeyboard
                  mode="pin"
                  onKey={appendPinDigit}
                  onBackspace={removePinDigit}
                  onCancel={closePinDialog}
                  onEnter={() => {
                    void handlePinReset();
                  }}
                  disabled={pendingAction?.type === 'pin'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="glass-panel w-full max-w-lg rounded-2xl border border-[color:var(--hg-border-soft)] px-6 py-6 md:px-8"
          >
            <div className="border-b border-[color:var(--hg-border-soft)] pb-5">
              <p className="text-(--hg-tertiary) text-[11px] font-bold tracking-[0.24em]">
                DELETE USER
              </p>
              <h2 id="delete-user-title" className="text-(--hg-text) mt-3 text-2xl font-semibold">
                Delete {deleteDialog.user.username}?
              </h2>
              <p className="text-(--hg-muted) mt-3 text-sm leading-6">
                This permanently removes the account and cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pendingAction?.type === 'delete'}
                onClick={closeDeleteDialog}
                className="rounded-lg bg-white/5 px-4 py-2 text-sm text-[var(--hg-muted)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pendingAction?.type === 'delete'}
                onClick={() => {
                  void handleDelete();
                }}
                className="rounded-lg bg-[color:var(--hg-secondary)] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingAction?.type === 'delete' ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
