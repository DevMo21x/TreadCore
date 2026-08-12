'use client';

import { useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BackupFile {
  filename: string;
  sizeInBytes: number;
  timestamp: string;
  type: 'automatic' | 'manual' | 'pre-restore';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts a byte count into a human-readable string
 * (for example: "2.45 MB" or "128 KB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Formats an ISO timestamp into a human-friendly date and time string
 */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
}

/**
 * Returns a styled badge for the backup type column
 */
function typeBadgeClasses(type: BackupFile['type']): string {
  switch (type) {
    case 'automatic':
      return 'border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] text-[color:var(--hg-secondary)]';
    case 'manual':
      return 'border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] text-green-400';
    case 'pre-restore':
      return 'border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] text-amber-300';
  }
}

/**
 * Returns the human-readable label for each backup type
 */
function typeLabel(type: BackupFile['type']): string {
  switch (type) {
    case 'automatic':
      return 'Automatic';
    case 'manual':
      return 'Manual';
    case 'pre-restore':
      return 'Pre-restore';
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function AdminBackupsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backingUp, setBackingUp] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'restore' | 'delete';
    filename: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  async function fetchBackups() {
    try {
      const response = await fetch('/api/admin/backups');

      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? 'Failed to load backups.');
        return;
      }

      const data: BackupFile[] = await response.json();
      setBackups(data);
      setError('');
    } catch {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Wrapped in an immediately-invoked async function so that the fetch
    // runs on mount without triggering the react-hooks/set-state-in-effect
    // lint rule (which flags direct setState calls in the effect body).
    (async () => {
      await fetchBackups();
    })();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Triggers an immediate manual backup and refreshes the list on success
   */
  async function handleManualBackup() {
    setBackingUp(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/backups', { method: 'POST' });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? 'Manual backup failed.');
        return;
      }

      setSuccess(`Manual backup created successfully: ${body.filename}`);
      await fetchBackups();
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setBackingUp(false);
    }
  }

  /**
   * Restores the database from the specified backup file after the
   * administrator has confirmed via the dialog
   */
  async function handleRestore(filename: string) {
    setConfirmLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? 'Restore failed.');
        return;
      }

      setSuccess(
        `Database restored successfully from "${filename}". ` +
          `A safety snapshot was saved as "${body.safetySnapshotFilename}". ` +
          'A server restart may be needed if any writes were in flight.'
      );
      await fetchBackups();
      setTimeout(() => setSuccess(''), 10000);
    } catch {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setConfirmLoading(false);
      setConfirmDialog(null);
    }
  }

  /**
   * Deletes a backup file after the administrator has confirmed via the dialog
   */
  async function handleDelete(filename: string) {
    setConfirmLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? 'Delete failed.');
        return;
      }

      setSuccess(`Backup file "${filename}" has been deleted.`);
      await fetchBackups();
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setConfirmLoading(false);
      setConfirmDialog(null);
    }
  }

  /**
   * Handles the confirm button click in the confirmation dialog by
   * routing to the correct action based on dialog type
   */
  function handleConfirmAction() {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'restore') {
      handleRestore(confirmDialog.filename);
    } else {
      handleDelete(confirmDialog.filename);
    }
  }

  // ── Summary Calculations ───────────────────────────────────────────────────

  const totalBackups = backups.length;

  const newestBackup = totalBackups > 0 ? backups[0] : null;
  const oldestBackup = totalBackups > 0 ? backups[backups.length - 1] : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[color:var(--hg-border-soft)] bg-[rgba(19,19,19,0.6)] px-8 py-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hg-text)]">
            Backup Management
          </h1>
          <p className="mt-1 text-sm text-[var(--hg-muted)]">
            View, create, restore and delete database backups
          </p>
        </div>

        <button
          onClick={handleManualBackup}
          disabled={backingUp}
          className="flex items-center gap-2 rounded-lg bg-[color:var(--hg-secondary)] px-5 py-2.5 text-sm font-bold tracking-[0.08em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {backingUp ? (
            <>
              {/* Simple spinner */}
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Backing up…
            </>
          ) : (
            'Backup Now'
          )}
        </button>
      </div>

      {/* ── Feedback Messages ── */}
      {error && (
        <div className="mx-8 mt-6 rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-8 mt-6 rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <p className="animate-pulse text-[var(--hg-muted)]">Loading backups…</p>
        </div>
      )}

      {/* ── Content (only shown when loading is complete) ── */}
      {!loading && (
        <>
          {/* ── Summary Section ── */}
          <div className="px-8 py-6">
            {totalBackups === 0 ? (
              // Empty state
              <div className="rounded-2xl border border-dashed border-[color:var(--hg-border-soft)] py-16 text-center">
                <svg
                  className="mx-auto mb-4 h-12 w-12 text-[var(--hg-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M20 6H4l2-4h12l2 4z" />
                  <rect x="3" y="6" width="18" height="14" rx="2" />
                  <path d="M8 10h8" />
                </svg>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hg-text)]">
                  No backups found
                </h2>
                <p className="mb-6 text-sm text-[var(--hg-muted)]">
                  Click the &quot;Backup Now&quot; button above to create your first manual backup
                </p>
              </div>
            ) : (
              // Summary cards
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl border border-[color:var(--hg-border-soft)] p-5">
                  <p className="mb-1 text-xs uppercase tracking-wide text-[var(--hg-muted)]">
                    Total Backups
                  </p>
                  <p className="text-2xl font-bold text-[var(--hg-text)]">{totalBackups}</p>
                </div>

                <div className="glass-panel rounded-xl border border-[color:var(--hg-border-soft)] p-5">
                  <p className="mb-1 text-xs uppercase tracking-wide text-[var(--hg-muted)]">
                    Most Recent Size
                  </p>
                  <p className="text-2xl font-bold text-[var(--hg-text)]">
                    {newestBackup ? formatFileSize(newestBackup.sizeInBytes) : '—'}
                  </p>
                </div>

                <div className="glass-panel rounded-xl border border-[color:var(--hg-border-soft)] p-5">
                  <p className="mb-1 text-xs uppercase tracking-wide text-[var(--hg-muted)]">
                    Most Recent Backup
                  </p>
                  <p className="text-sm font-medium text-[var(--hg-text)]">
                    {newestBackup ? formatTimestamp(newestBackup.timestamp) : '—'}
                  </p>
                </div>

                <div className="glass-panel rounded-xl border border-[color:var(--hg-border-soft)] p-5">
                  <p className="mb-1 text-xs uppercase tracking-wide text-[var(--hg-muted)]">
                    Oldest Backup
                  </p>
                  <p className="text-sm font-medium text-[var(--hg-text)]">
                    {oldestBackup ? formatTimestamp(oldestBackup.timestamp) : '—'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Backup List Table ── */}
          {totalBackups > 0 && (
            <div className="px-8 pb-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--hg-border-soft)] text-left text-[11px] font-bold tracking-[0.2em] text-[var(--hg-muted)]">
                    <th className="pb-3 pr-4">Filename</th>
                    <th className="pb-3 pr-4">Size</th>
                    <th className="pb-3 pr-4">Timestamp</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr
                      key={backup.filename}
                      className="border-b border-[color:var(--hg-border-soft)] hover:bg-white/5 transition"
                    >
                      <td className="max-w-64 truncate py-3 pr-4 font-mono text-xs text-[var(--hg-text)]">
                        {backup.filename}
                      </td>
                      <td className="py-3 pr-4 text-[var(--hg-muted)]">
                        {formatFileSize(backup.sizeInBytes)}
                      </td>
                      <td className="py-3 pr-4 text-[var(--hg-muted)]">
                        {formatTimestamp(backup.timestamp)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block text-xs px-2.5 py-0.5 rounded-full border ${typeBadgeClasses(backup.type)}`}
                        >
                          {typeLabel(backup.type)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setConfirmDialog({ type: 'restore', filename: backup.filename })
                            }
                            className="rounded px-3 py-1 text-xs text-[color:var(--hg-secondary)] transition bg-[color:var(--hg-secondary)]/10 hover:bg-[color:var(--hg-secondary)]/20"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({ type: 'delete', filename: backup.filename })
                            }
                            className="rounded px-3 py-1 text-xs text-red-400 transition bg-red-400/10 hover:bg-red-400/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Confirmation Dialog ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="glass-panel w-full max-w-md rounded-2xl border border-[color:var(--hg-border-soft)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="border-b border-[color:var(--hg-border-soft)] p-6">
              <h2 id="confirm-dialog-title" className="text-lg font-semibold">
                {confirmDialog.type === 'restore'
                  ? 'Confirm Database Restore'
                  : 'Confirm Backup Deletion'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {confirmDialog.type === 'restore' ? (
                <>
                  <p className="text-sm text-[var(--hg-muted)]">
                    This will{' '}
                    <strong className="text-red-400">overwrite the current database</strong> with
                    the contents of the selected backup file:
                  </p>
                  <p className="break-all rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 font-mono text-xs text-[var(--hg-muted)]">
                    {confirmDialog.filename}
                  </p>
                  <p className="text-sm text-[var(--hg-muted)]">
                    A safety snapshot of the current database will be saved before the restore
                    proceeds. If any writes were in flight then a server restart may be needed after
                    the restore completes.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--hg-muted)]">
                    This will <strong className="text-red-400">permanently delete</strong> the
                    following backup file:
                  </p>
                  <p className="break-all rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 font-mono text-xs text-[var(--hg-muted)]">
                    {confirmDialog.filename}
                  </p>
                  <p className="text-sm text-[var(--hg-muted)]">This action cannot be undone.</p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-[color:var(--hg-border-soft)] p-6">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={confirmLoading}
                className="rounded-lg bg-white/5 px-4 py-2 text-sm text-[var(--hg-muted)] transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className="flex items-center gap-2 rounded-lg bg-[color:var(--hg-secondary)] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {confirmLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Processing…
                  </>
                ) : confirmDialog.type === 'restore' ? (
                  'Confirm Restore'
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
