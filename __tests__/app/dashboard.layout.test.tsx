import type { PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/users/userService', () => ({
  findUserProfileById: vi.fn(),
}));

vi.mock('@/components/auth/InactiveSessionGuard', () => ({
  InactiveSessionGuard: ({ children }: PropsWithChildren<{ callbackUrl: string }>) => (
    <div data-testid="inactive-guard">{children}</div>
  ),
}));

vi.mock('@/components/WorkoutOrchestrator', () => ({
  WorkoutOrchestrator: ({ userId }: { userId: number }) => (
    <div data-testid="workout-orchestrator" data-user-id={String(userId)} />
  ),
}));

vi.mock('@/components/NotificationOverlay', () => ({
  NotificationOverlay: () => <div data-testid="notification-overlay" />,
}));

vi.mock('@/components/layout/DashboardBottomNav', () => ({
  DashboardBottomNav: ({
    isGuest,
    initialThemeMode,
    canPersistTheme,
  }: {
    isGuest: boolean;
    initialThemeMode: string;
    canPersistTheme: boolean;
  }) => (
    <div
      data-testid="dashboard-bottom-nav"
      data-guest={String(isGuest)}
      data-theme={initialThemeMode}
      data-persist={String(canPersistTheme)}
    />
  ),
}));

vi.mock('@/components/dashboard/DashboardPersistentBar', () => ({
  DashboardPersistentBar: () => <div data-testid="dashboard-persistent-bar" />,
}));

const mockRedirect = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (...arguments_: unknown[]) => {
    mockRedirect(...arguments_);
    throw new Error('NEXT_REDIRECT');
  },
}));

import { auth } from '@/auth';
import DashboardLayout from '@/app/dashboard/layout';
import { GUEST_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';
import { findUserProfileById } from '@/lib/users/userService';
import { THEME_MODE_DARK, THEME_MODE_LIGHT } from '@/lib/users/themeMode';

const mockedAuth = vi.mocked(auth);
const mockedFindUserProfileById = vi.mocked(findUserProfileById);

describe('DashboardLayout', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedFindUserProfileById.mockReset();
    mockRedirect.mockReset();

    mockedFindUserProfileById.mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: null,
      ageYears: null,
      themeMode: THEME_MODE_DARK,
      createdAt: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to the login page', async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(DashboardLayout({ children: <div /> })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('applies dark mode by default for signed-in members', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: '1', role: USER_ROLE, username: 'alice' },
    } as any);

    const layout = await DashboardLayout({ children: <div>Dashboard body</div> });
    const { container } = render(layout);

    const themeRoot = container.querySelector('.hyper-grid-theme');

    expect(themeRoot).toBeInTheDocument();
    expect(themeRoot).not.toHaveClass('light');
    expect(screen.getByTestId('dashboard-bottom-nav')).toHaveAttribute(
      'data-theme',
      THEME_MODE_DARK
    );
    expect(screen.getByTestId('dashboard-bottom-nav')).toHaveAttribute('data-persist', 'true');
  });

  it('restores a saved light mode preference server-side', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: '1', role: USER_ROLE, username: 'alice' },
    } as any);
    mockedFindUserProfileById.mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: null,
      ageYears: null,
      themeMode: THEME_MODE_LIGHT,
      createdAt: null,
    });

    const layout = await DashboardLayout({ children: <div>Dashboard body</div> });
    const { container } = render(layout);

    const themeRoot = container.querySelector('.hyper-grid-theme');

    expect(themeRoot).toHaveClass('light');
    expect(screen.getByTestId('dashboard-bottom-nav')).toHaveAttribute(
      'data-theme',
      THEME_MODE_LIGHT
    );
  });

  it('forces guests to dark mode and disables persistence even if a light preference exists', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: '1', role: GUEST_ROLE, username: 'guest-1' },
    } as any);
    mockedFindUserProfileById.mockResolvedValue({
      id: 1,
      username: 'guest-1',
      role: GUEST_ROLE,
      weightKg: null,
      ageYears: null,
      themeMode: THEME_MODE_LIGHT,
      createdAt: null,
    });

    const layout = await DashboardLayout({ children: <div>Dashboard body</div> });
    const { container } = render(layout);

    const themeRoot = container.querySelector('.hyper-grid-theme');

    expect(themeRoot).not.toHaveClass('light');
    expect(screen.getByTestId('dashboard-bottom-nav')).toHaveAttribute(
      'data-theme',
      THEME_MODE_DARK
    );
    expect(screen.getByTestId('dashboard-bottom-nav')).toHaveAttribute('data-persist', 'false');
    expect(screen.getByTestId('dashboard-bottom-nav')).toHaveAttribute('data-guest', 'true');
  });

  it('mounts the notification overlay inside the dashboard main container', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: '1', role: USER_ROLE, username: 'alice' },
    } as any);

    const layout = await DashboardLayout({ children: <div>Dashboard body</div> });
    const { container } = render(layout);

    const main = container.querySelector('main');

    expect(main).toHaveClass('relative');
    expect(main).toContainElement(screen.getByTestId('notification-overlay'));
  });
});
