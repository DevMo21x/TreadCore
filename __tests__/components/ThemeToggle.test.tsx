import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUpdateCurrentThemeMode } = vi.hoisted(() => ({
  mockUpdateCurrentThemeMode: vi.fn(),
}));

vi.mock('@/lib/actions/user', () => ({
  updateCurrentThemeMode: mockUpdateCurrentThemeMode,
}));

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { THEME_MODE_DARK, THEME_MODE_LIGHT } from '@/lib/users/themeMode';

function renderToggle(overrides: Partial<Parameters<typeof ThemeToggle>[0]> = {}) {
  return render(
    <div data-testid="theme-root" className="hyper-grid-theme">
      <ThemeToggle
        initialThemeMode={THEME_MODE_DARK}
        canPersistTheme={true}
        isGuest={false}
        {...overrides}
      />
    </div>
  );
}

function createDeferred<T>(_sample?: T) {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockUpdateCurrentThemeMode.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('toggles the root class immediately and persists the new mode for members', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred({
      id: 1,
      username: 'alice',
      role: 'user' as const,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_LIGHT,
    });

    mockUpdateCurrentThemeMode.mockReturnValueOnce(deferred.promise);

    renderToggle();

    const themeRoot = screen.getByTestId('theme-root');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(themeRoot).toHaveClass('light');
    expect(mockUpdateCurrentThemeMode).toHaveBeenCalledWith({ themeMode: THEME_MODE_LIGHT });

    deferred.resolve({
      id: 1,
      username: 'alice',
      role: 'user',
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_LIGHT,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    });
  });

  it('reverts the optimistic class when persistence fails', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<never>();

    mockUpdateCurrentThemeMode.mockReturnValueOnce(deferred.promise);

    renderToggle();

    const themeRoot = screen.getByTestId('theme-root');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(themeRoot).toHaveClass('light');

    deferred.reject(new Error('database offline'));

    await waitFor(() => {
      expect(themeRoot).not.toHaveClass('light');
      expect(screen.getByText('Unable to save theme preference.')).toBeInTheDocument();
    });
  });

  it('toggles locally for guests without attempting a write', async () => {
    const user = userEvent.setup();

    renderToggle({ isGuest: true, canPersistTheme: false });

    const themeRoot = screen.getByTestId('theme-root');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(themeRoot).toHaveClass('light');
    expect(mockUpdateCurrentThemeMode).not.toHaveBeenCalled();
  });
});
