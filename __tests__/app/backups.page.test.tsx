import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminBackupsPage from '@/app/admin/backups/page';

// ─── Mock fetch globally ─────────────────────────────────────────────────────

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Test Data ───────────────────────────────────────────────────────────────

const sampleBackups = [
  {
    filename: 'manual-backup-2026-05-07T14-30-00Z.sqlite',
    sizeInBytes: 2097152,
    timestamp: '2026-05-07T14:30:00Z',
    type: 'manual',
  },
  {
    filename: 'backup-2026-05-06T02-00-00Z.sqlite',
    sizeInBytes: 1048576,
    timestamp: '2026-05-06T02:00:00Z',
    type: 'automatic',
  },
  {
    filename: 'pre-restore-2026-05-05T10-00-00Z.sqlite',
    sizeInBytes: 524288,
    timestamp: '2026-05-05T10:00:00Z',
    type: 'pre-restore',
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AdminBackupsPage', () => {
  it('renders the page heading and Backup Now button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading backups…')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Backup Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /backup now/i })).toBeInTheDocument();
  });

  it('uses HyperGrid token classes for layout and confirmation modal', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    const { container } = render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading backups…')).not.toBeInTheDocument();
    });

    const pageRoot = container.firstElementChild;
    expect(pageRoot).not.toHaveClass('min-h-screen');
    expect(pageRoot).not.toHaveClass('bg-gray-950');

    const backupNowButton = screen.getByRole('button', { name: /backup now/i });
    expect(backupNowButton).toHaveClass('bg-[color:var(--hg-secondary)]');
    expect(backupNowButton).toHaveClass('text-black');

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await user.click(deleteButtons[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('glass-panel');
    expect(dialog).toHaveClass('border-[color:var(--hg-border-soft)]');
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveClass('bg-white/5');
    expect(screen.getByRole('button', { name: /confirm delete/i })).toHaveClass(
      'bg-[color:var(--hg-secondary)]'
    );
  });

  it('displays the empty state when no backups exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('No backups found')).toBeInTheDocument();
    });
  });

  it('renders the summary cards when backups exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Backups')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Most Recent Size')).toBeInTheDocument();
      expect(screen.getByText('Most Recent Backup')).toBeInTheDocument();
      expect(screen.getByText('Oldest Backup')).toBeInTheDocument();
    });
  });

  it('renders all backups in the table with correct type badges', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('manual-backup-2026-05-07T14-30-00Z.sqlite')).toBeInTheDocument();
      expect(screen.getByText('backup-2026-05-06T02-00-00Z.sqlite')).toBeInTheDocument();
      expect(screen.getByText('pre-restore-2026-05-05T10-00-00Z.sqlite')).toBeInTheDocument();

      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('Automatic')).toBeInTheDocument();
      expect(screen.getByText('Pre-restore')).toBeInTheDocument();
    });
  });

  it('shows an error message when the API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Backup system is not configured.' }),
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('Backup system is not configured.')).toBeInTheDocument();
    });
  });

  it('opens a restore confirmation dialog when Restore is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('backup-2026-05-06T02-00-00Z.sqlite')).toBeInTheDocument();
    });

    const restoreButtons = screen.getAllByRole('button', { name: /restore/i });
    await userEvent.click(restoreButtons[0]);

    expect(screen.getByText('Confirm Database Restore')).toBeInTheDocument();
    expect(screen.getByText(/overwrite the current database/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm restore/i })).toBeInTheDocument();
  });

  it('opens a delete confirmation dialog when Delete is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('backup-2026-05-06T02-00-00Z.sqlite')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Backup Deletion')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
  });

  it('closes the confirmation dialog when Cancel is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('backup-2026-05-06T02-00-00Z.sqlite')).toBeInTheDocument();
    });

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);
    expect(screen.getByText('Confirm Backup Deletion')).toBeInTheDocument();

    // Close dialog
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('Confirm Backup Deletion')).not.toBeInTheDocument();
  });

  it('disables the Backup Now button and shows loading state while backing up', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    // Manual backup response - Resolve later
    let resolveBackup: (value: unknown) => void;
    const backupPromise = new Promise((resolve) => {
      resolveBackup = resolve;
    });

    render(<AdminBackupsPage />);

    await waitFor(() => {
      expect(screen.getByText('Backup Management')).toBeInTheDocument();
    });

    // Setup the mock for the POST call before clicking
    mockFetch.mockImplementationOnce(() => backupPromise);

    const backupButton = screen.getByRole('button', { name: /backup now/i });
    await userEvent.click(backupButton);

    // Button should show loading state
    expect(screen.getByText(/backing up/i)).toBeInTheDocument();

    // Resolve the backup
    resolveBackup!({
      ok: true,
      json: async () => ({ success: true, filename: 'manual-backup-2026-05-07T15-00-00Z.sqlite' }),
    });

    // After resolution, the list refresh call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleBackups,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /backup now/i })).not.toBeDisabled();
    });
  });
});
