import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const mockedBackupService = vi.hoisted(() => ({
  listBackups: vi.fn(),
  performManualBackup: vi.fn(),
  restoreFromBackup: vi.fn(),
  deleteBackupFile: vi.fn(),
}));

const mockedConfig = vi.hoisted(() => ({
  loadBackupConfig: vi.fn(),
}));

vi.mock('@/lib/backup', () => mockedBackupService);
vi.mock('@/lib/backup/config', () => mockedConfig);

// ─── Module Imports ──────────────────────────────────────────────────────────

import { GET, POST } from '@/app/api/admin/backups/route';
import { POST as RESTORE_POST } from '@/app/api/admin/backups/restore/route';
import { DELETE } from '@/app/api/admin/backups/[filename]/route';

// ─── Test Data ───────────────────────────────────────────────────────────────

const sampleConfig = {
  destinationPath: '/media/usb/backups',
  cronSchedule: '0 2 * * *',
  retentionDays: 30,
  databasePath: 'sqlite.db',
};

const sampleBackups = [
  {
    filename: 'backup-2026-05-07T02-00-00Z.sqlite',
    sizeInBytes: 1048576,
    timestamp: '2026-05-07T02:00:00Z',
    type: 'automatic',
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/admin/backups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when backup configuration is missing', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain('not configured');
  });

  it('returns the list of backups when configured', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.listBackups.mockReturnValue(sampleBackups);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].filename).toBe('backup-2026-05-07T02-00-00Z.sqlite');
  });
});

describe('POST /api/admin/backups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when backup configuration is missing', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(null);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain('not configured');
  });

  it('returns 500 when manual backup fails', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.performManualBackup.mockResolvedValue(null);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('failed');
  });

  it('returns success with the filename when backup succeeds', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.performManualBackup.mockResolvedValue(
      'manual-backup-2026-05-07T14-30-00Z.sqlite'
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.filename).toBe('manual-backup-2026-05-07T14-30-00Z.sqlite');
  });
});

describe('POST /api/admin/backups/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when backup configuration is missing', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(null);

    const request = new Request('http://localhost/api/admin/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'backup-2026-05-07T02-00-00Z.sqlite' }),
    });

    const response = await RESTORE_POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain('not configured');
  });

  it('returns 400 when filename is missing from the request body', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);

    const request = new Request('http://localhost/api/admin/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await RESTORE_POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('filename');
  });

  it('returns 500 when restore fails', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.restoreFromBackup.mockResolvedValue({
      success: false,
      error: 'File does not exist',
    });

    const request = new Request('http://localhost/api/admin/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'backup-2026-05-07T02-00-00Z.sqlite' }),
    });

    const response = await RESTORE_POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('does not exist');
  });

  it('returns success with safety snapshot filename when restore succeeds', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.restoreFromBackup.mockResolvedValue({
      success: true,
      safetySnapshotFilename: 'pre-restore-2026-05-07T14-30-00Z.sqlite',
    });

    const request = new Request('http://localhost/api/admin/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'backup-2026-05-07T02-00-00Z.sqlite' }),
    });

    const response = await RESTORE_POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.safetySnapshotFilename).toBe('pre-restore-2026-05-07T14-30-00Z.sqlite');
  });
});

describe('DELETE /api/admin/backups/[filename]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when backup configuration is missing', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(null);

    const request = new Request('http://localhost/api/admin/backups/test.sqlite', {
      method: 'DELETE',
    });

    const response = await DELETE(request as any, {
      params: Promise.resolve({ filename: 'backup-2026-05-07T02-00-00Z.sqlite' }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain('not configured');
  });

  it('returns 400 when the filename is not a recognized backup file', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.deleteBackupFile.mockReturnValue({
      success: false,
      error: 'The provided filename is not a recognized backup file',
      errorCategory: 'validation',
    });

    const request = new Request('http://localhost/api/admin/backups/bad-file.txt', {
      method: 'DELETE',
    });

    const response = await DELETE(request as any, {
      params: Promise.resolve({ filename: 'bad-file.txt' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('not a recognized');
  });

  it('returns 500 when a filesystem error occurs during deletion', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.deleteBackupFile.mockReturnValue({
      success: false,
      error: 'Failed to delete file: EPERM: operation not permitted',
      errorCategory: 'server',
    });

    const request = new Request(
      'http://localhost/api/admin/backups/backup-2026-05-07T02-00-00Z.sqlite',
      { method: 'DELETE' }
    );

    const response = await DELETE(request as any, {
      params: Promise.resolve({ filename: 'backup-2026-05-07T02-00-00Z.sqlite' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Failed to delete file');
  });

  it('returns success when the file is deleted', async () => {
    mockedConfig.loadBackupConfig.mockReturnValue(sampleConfig);
    mockedBackupService.deleteBackupFile.mockReturnValue({ success: true });

    const request = new Request(
      'http://localhost/api/admin/backups/backup-2026-05-07T02-00-00Z.sqlite',
      { method: 'DELETE' }
    );

    const response = await DELETE(request as any, {
      params: Promise.resolve({ filename: 'backup-2026-05-07T02-00-00Z.sqlite' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
