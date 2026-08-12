import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const mockedCron = vi.hoisted(() => ({
  schedule: vi.fn(),
  validate: vi.fn(() => true),
}));

const mockedDatabase = vi.hoisted(() => {
  const backupFunction = vi.fn().mockResolvedValue(undefined);
  const closeFunction = vi.fn();
  const constructorFunction = vi.fn(function () {
    return { backup: backupFunction, close: closeFunction };
  });
  return { constructorFunction, backupFunction, closeFunction };
});

vi.mock('node-cron', () => ({
  default: mockedCron,
  ...mockedCron,
}));

vi.mock('better-sqlite3', () => {
  return { default: mockedDatabase.constructorFunction, __esModule: true };
});

// ─── Module Imports (after mocks are declared) ───────────────────────────────

import { loadBackupConfig } from '@/lib/backup/config';
import {
  performBackup,
  cleanupOldBackups,
  scheduleBackup,
  listBackups,
  performManualBackup,
  restoreFromBackup,
  deleteBackupFile,
  isValidBackupFilename,
} from '@/lib/backup';
import type { BackupConfig } from '@/lib/backup/config';
import { logBackupEvent } from '@/lib/backup/logger';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createValidConfig(overrides: Partial<BackupConfig> = {}): BackupConfig {
  return {
    destinationPath: '/tmp/test-backups',
    cronSchedule: '0 2 * * *',
    retentionDays: 30,
    databasePath: 'sqlite.db',
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Backup Configuration', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
  });

  afterEach(() => {
    process.env = originalEnvironment;
  });

  it('returns null when BACKUP_DESTINATION_PATH is missing', () => {
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '30';
    delete process.env.BACKUP_DESTINATION_PATH;

    const config = loadBackupConfig();
    expect(config).toBeNull();
  });

  it('returns null when BACKUP_CRON_SCHEDULE is missing', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_RETENTION_DAYS = '30';
    delete process.env.BACKUP_CRON_SCHEDULE;

    const config = loadBackupConfig();
    expect(config).toBeNull();
  });

  it('returns null when BACKUP_RETENTION_DAYS is missing', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    delete process.env.BACKUP_RETENTION_DAYS;

    const config = loadBackupConfig();
    expect(config).toBeNull();
  });

  it('returns null when BACKUP_RETENTION_DAYS is not a valid positive integer', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = 'abc';

    const config = loadBackupConfig();
    expect(config).toBeNull();
  });

  it('returns null when BACKUP_RETENTION_DAYS is zero', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '0';

    const config = loadBackupConfig();
    expect(config).toBeNull();
  });

  it('returns a valid config when all required variables are set', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '30';
    process.env.DATABASE_PATH = './data/app.db';

    const config = loadBackupConfig();

    expect(config).toEqual({
      destinationPath: '/media/usb/backups',
      cronSchedule: '0 2 * * *',
      retentionDays: 30,
      databasePath: './data/app.db',
    });
  });

  it('defaults DATABASE_PATH to "sqlite.db" when not set', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '7';
    delete process.env.DATABASE_PATH;

    const config = loadBackupConfig();

    expect(config).not.toBeNull();
    expect(config!.databasePath).toBe('sqlite.db');
  });

  it('trims whitespace from environment variable values', () => {
    process.env.BACKUP_DESTINATION_PATH = '  /media/usb/backups  ';
    process.env.BACKUP_CRON_SCHEDULE = '  0 2 * * *  ';
    process.env.BACKUP_RETENTION_DAYS = '  14  ';

    const config = loadBackupConfig();

    expect(config).not.toBeNull();
    expect(config!.destinationPath).toBe('/media/usb/backups');
    expect(config!.cronSchedule).toBe('0 2 * * *');
    expect(config!.retentionDays).toBe(14);
  });
});

describe('performBackup', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedDatabase.backupFunction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns false and logs failure when destination path is not accessible', async () => {
    const config = createValidConfig({ destinationPath: '/nonexistent/path' });

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = await performBackup(config);

    expect(result).toBe(false);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"failure"'));
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('does not exist or is not writable')
    );
  });

  it('returns false and logs failure when source database does not exist', async () => {
    const config = createValidConfig({ databasePath: '/nonexistent/database.db' });

    // First call (destination check) succeeds, second call (source check) fails
    let callCount = 0;
    vi.spyOn(fs, 'accessSync').mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        throw new Error('ENOENT');
      }
    });

    const result = await performBackup(config);

    expect(result).toBe(false);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not readable'));
  });

  it('returns true and logs success when backup completes successfully', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 1048576 } as fs.Stats);

    const result = await performBackup(config);

    expect(result).toBe(true);
    expect(mockedDatabase.constructorFunction).toHaveBeenCalledWith(
      path.resolve(config.databasePath),
      { readonly: true }
    );
    expect(mockedDatabase.backupFunction).toHaveBeenCalled();
    expect(mockedDatabase.closeFunction).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"success"'));
  });

  it('returns false and logs failure when the backup API throws an error', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});
    mockedDatabase.backupFunction.mockRejectedValue(new Error('Disk full'));

    const result = await performBackup(config);

    expect(result).toBe(false);
    expect(mockedDatabase.closeFunction).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('failed unexpectedly'));
  });
});

describe('cleanupOldBackups', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('logs a warning and returns early when destination is not accessible', () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    cleanupOldBackups(config);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cannot perform retention cleanup')
    );
  });

  it('deletes backup files older than the retention period', () => {
    const config = createValidConfig({ retentionDays: 7 });

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});

    // Create a file dated 10 days ago (should be deleted) and one from today (should be kept)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const oldTimestamp = oldDate
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\.\d{3}Z$/, 'Z');
    const oldFileName = `backup-${oldTimestamp}.sqlite`;

    const recentDate = new Date();
    const recentTimestamp = recentDate
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\.\d{3}Z$/, 'Z');
    const recentFileName = `backup-${recentTimestamp}.sqlite`;

    vi.spyOn(fs, 'readdirSync').mockReturnValue([
      oldFileName,
      recentFileName,
      'pre-restore-2026-05-01T10-00-00Z.sqlite',
      'random-file.txt',
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    cleanupOldBackups(config);

    // Only the old file should be deleted
    expect(unlinkSpy).toHaveBeenCalledTimes(1);
    expect(unlinkSpy).toHaveBeenCalledWith(path.join(config.destinationPath, oldFileName));
  });

  it('does not delete files within the retention period', () => {
    const config = createValidConfig({ retentionDays: 30 });

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});

    const recentTimestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\.\d{3}Z$/, 'Z');

    vi.spyOn(fs, 'readdirSync').mockReturnValue([
      `backup-${recentTimestamp}.sqlite`,
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    cleanupOldBackups(config);

    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('ignores files that do not match the backup naming pattern', () => {
    const config = createValidConfig({ retentionDays: 1 });

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});

    vi.spyOn(fs, 'readdirSync').mockReturnValue([
      'pre-restore-2026-01-01T00-00-00Z.sqlite',
      'notes.txt',
      'backup-.sqlite',
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    cleanupOldBackups(config);

    expect(unlinkSpy).not.toHaveBeenCalled();
  });
});

describe('scheduleBackup', () => {
  const originalEnvironment = process.env;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnvironment };
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedCron.schedule.mockClear();
    mockedCron.validate.mockReturnValue(true);
  });

  afterEach(() => {
    process.env = originalEnvironment;
    consoleLogSpy.mockRestore();
  });

  it('logs a failure and does not schedule when configuration is incomplete', () => {
    // Ensure no backup variables are set
    delete process.env.BACKUP_DESTINATION_PATH;
    delete process.env.BACKUP_CRON_SCHEDULE;
    delete process.env.BACKUP_RETENTION_DAYS;

    // Determine where the implementation will write logs. This respects
    // the optional `BACKUP_LOGS_PATH` environment variable and falls back
    // to a `logs` folder in the current working directory.
    const expectedLogsDir = process.env.BACKUP_LOGS_PATH?.trim()
      ? path.resolve(process.env.BACKUP_LOGS_PATH!.trim())
      : path.resolve(process.cwd(), 'logs');

    const makeDirectorySpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    const writeFileSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    scheduleBackup();

    expect(mockedCron.schedule).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"failure"'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('failed'));
    // The writer should attempt to create the configured logs directory
    // and write exactly one failure log file for this scenario.
    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    expect(makeDirectorySpy).toHaveBeenCalledWith(expectedLogsDir, {
      recursive: true,
    });
  });

  it('logs a warning when the cron expression is invalid', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = 'invalid-cron';
    process.env.BACKUP_RETENTION_DAYS = '30';

    mockedCron.validate.mockReturnValue(false);

    scheduleBackup();

    expect(mockedCron.schedule).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('not a valid cron expression')
    );
  });

  it('registers a cron job when configuration is valid', () => {
    process.env.BACKUP_DESTINATION_PATH = '/media/usb/backups';
    process.env.BACKUP_CRON_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '30';

    scheduleBackup();

    expect(mockedCron.schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"scheduled"'));
  });
});

describe('failure log files', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let makeDirectorySpy: ReturnType<typeof vi.spyOn>;
  let writeFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    makeDirectorySpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    writeFileSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('writes a backup failure file when a backup failure event is logged', () => {
    // Respect an optional configured logs path, otherwise default to
    // `<cwd>/logs` as the implementation does.
    const expectedLogsDir = process.env.BACKUP_LOGS_PATH?.trim()
      ? path.resolve(process.env.BACKUP_LOGS_PATH!.trim())
      : path.resolve(process.cwd(), 'logs');

    // Trigger a structured failure event which should cause a failure log file
    // to be written to the configured logs directory.
    logBackupEvent('failure', 'Database backup failed unexpectedly.', {
      error: 'Disk full',
      destinationPath: '/tmp/test-backups',
    });

    expect(makeDirectorySpy).toHaveBeenCalledWith(expectedLogsDir, {
      recursive: true,
    });
    expect(writeFileSpy).toHaveBeenCalledTimes(1);

    const [filePath, fileContents] = writeFileSpy.mock.calls[0];

    // Ensure the file was created inside the expected logs directory and
    // that its basename matches the backup-failure naming pattern used by
    // the implementation.
    expect(path.dirname(String(filePath))).toBe(expectedLogsDir);
    expect(path.basename(String(filePath))).toMatch(
      /^backup-failure-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.log$/
    );
    expect(String(fileContents)).toContain('Failure Reason: Database backup failed unexpectedly.');
    expect(String(fileContents)).toContain('Disk full');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"failure"'));
  });

  it('writes a restore failure file when restore category is provided', () => {
    const expectedLogsDir = process.env.BACKUP_LOGS_PATH?.trim()
      ? path.resolve(process.env.BACKUP_LOGS_PATH!.trim())
      : path.resolve(process.cwd(), 'logs');

    logBackupEvent(
      'failure',
      'Database restore failed.',
      {
        error: 'Permission denied',
        backupFile: '/tmp/test-backups/backup-2026-05-22T10-00-00Z.sqlite',
      },
      'restore'
    );

    const [filePath, fileContents] = writeFileSpy.mock.calls[0];

    expect(path.dirname(String(filePath))).toBe(expectedLogsDir);
    expect(path.basename(String(filePath))).toMatch(
      /^restore-failure-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.log$/
    );
    expect(String(fileContents)).toContain('Failure Reason: Database restore failed.');
    expect(String(fileContents)).toContain('Permission denied');
  });

  it('warns and falls back to default logs dir when BACKUP_LOGS_PATH is relative', () => {
    const originalEnv = process.env.BACKUP_LOGS_PATH;

    try {
      process.env.BACKUP_LOGS_PATH = 'relative/path';

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logBackupEvent('failure', 'Test failure.');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('BACKUP_LOGS_PATH "relative/path" is a relative path')
      );

      const [filePath] = writeFileSpy.mock.calls[0];
      expect(path.dirname(String(filePath))).toBe(path.resolve(process.cwd(), 'logs'));
    } finally {
      process.env.BACKUP_LOGS_PATH = originalEnv;
    }
  });
});

// ─── isValidBackupFilename ───────────────────────────────────────────────────

describe('isValidBackupFilename', () => {
  it('accepts automatic backup filenames', () => {
    expect(isValidBackupFilename('backup-2026-05-07T02-00-00Z.sqlite')).toBe(true);
  });

  it('accepts manual backup filenames', () => {
    expect(isValidBackupFilename('manual-backup-2026-05-07T14-30-00Z.sqlite')).toBe(true);
  });

  it('accepts pre-restore snapshot filenames', () => {
    expect(isValidBackupFilename('pre-restore-2026-05-07T14-30-00Z.sqlite')).toBe(true);
  });

  it('rejects filenames that do not match any recognized pattern', () => {
    expect(isValidBackupFilename('random-file.txt')).toBe(false);
    expect(isValidBackupFilename('../etc/passwd')).toBe(false);
    expect(isValidBackupFilename('backup-.sqlite')).toBe(false);
    expect(isValidBackupFilename('')).toBe(false);
  });
});

// ─── listBackups ─────────────────────────────────────────────────────────────

describe('listBackups', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns an empty array when destination is not accessible', () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = listBackups(config);
    expect(result).toEqual([]);
  });

  it('returns backup metadata sorted newest first', () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});
    vi.spyOn(fs, 'readdirSync').mockReturnValue([
      'backup-2026-05-01T02-00-00Z.sqlite',
      'manual-backup-2026-05-05T14-30-00Z.sqlite',
      'pre-restore-2026-05-03T10-00-00Z.sqlite',
      'random-file.txt',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 2097152 } as fs.Stats);

    const result = listBackups(config);

    expect(result).toHaveLength(3);
    // Newest first
    expect(result[0].filename).toBe('manual-backup-2026-05-05T14-30-00Z.sqlite');
    expect(result[0].type).toBe('manual');
    expect(result[1].filename).toBe('pre-restore-2026-05-03T10-00-00Z.sqlite');
    expect(result[1].type).toBe('pre-restore');
    expect(result[2].filename).toBe('backup-2026-05-01T02-00-00Z.sqlite');
    expect(result[2].type).toBe('automatic');
  });

  it('includes correct size and timestamp in each entry', () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});
    vi.spyOn(fs, 'readdirSync').mockReturnValue([
      'backup-2026-05-07T02-00-00Z.sqlite',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 1048576 } as fs.Stats);

    const result = listBackups(config);

    expect(result).toHaveLength(1);
    expect(result[0].sizeInBytes).toBe(1048576);
    expect(result[0].timestamp).toBe('2026-05-07T02:00:00Z');
  });
});

// ─── performManualBackup ─────────────────────────────────────────────────────

describe('performManualBackup', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedDatabase.backupFunction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns null when destination is not accessible', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = await performManualBackup(config);

    expect(result).toBeNull();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Manual backup failed'));
  });

  it('returns the filename on success with manual-backup prefix', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 1048576 } as fs.Stats);

    const result = await performManualBackup(config);

    expect(result).not.toBeNull();
    expect(result).toMatch(/^manual-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.sqlite$/);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Manual backup created successfully')
    );
  });

  it('returns null when the backup API throws an error', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'accessSync').mockImplementation(() => {});
    mockedDatabase.backupFunction.mockRejectedValue(new Error('Disk full'));

    const result = await performManualBackup(config);

    expect(result).toBeNull();
  });
});

// ─── restoreFromBackup ───────────────────────────────────────────────────────

describe('restoreFromBackup', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns an error for unrecognized filenames', async () => {
    const config = createValidConfig();
    const result = await restoreFromBackup(config, '../etc/passwd');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not a recognized backup file');
  });

  it('returns an error when the backup file does not exist', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
      // The backup file does not exist, but the database does
      if (String(filePath).includes('backup-2026')) return false;
      return true;
    });

    const result = await restoreFromBackup(config, 'backup-2026-05-07T02-00-00Z.sqlite');

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('creates a safety snapshot and restores successfully', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const copySpy = vi.spyOn(fs.promises, 'copyFile').mockResolvedValue();

    const result = await restoreFromBackup(config, 'backup-2026-05-07T02-00-00Z.sqlite');

    expect(result.success).toBe(true);
    expect(result.safetySnapshotFilename).toMatch(/^pre-restore-/);
    // Two copies: safety snapshot + restore overwrite
    expect(copySpy).toHaveBeenCalledTimes(2);
  });

  it('returns an error when the safety snapshot copy fails', async () => {
    const config = createValidConfig();

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs.promises, 'copyFile').mockRejectedValue(new Error('Permission denied'));

    const result = await restoreFromBackup(config, 'backup-2026-05-07T02-00-00Z.sqlite');

    expect(result.success).toBe(false);
    expect(result.error).toContain('safety snapshot');
  });
});

// ─── deleteBackupFile ────────────────────────────────────────────────────────

describe('deleteBackupFile', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns an error for unrecognized filenames', () => {
    const config = createValidConfig();
    const result = deleteBackupFile(config, '../secret-file.txt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not a recognized backup file');
    expect(result.errorCategory).toBe('validation');
  });

  it('returns an error when the file does not exist', () => {
    const config = createValidConfig();

    const enoentError = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT';
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw enoentError;
    });

    const result = deleteBackupFile(config, 'backup-2026-05-07T02-00-00Z.sqlite');

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
    expect(result.errorCategory).toBe('validation');
  });

  it('deletes the file and returns success', () => {
    const config = createValidConfig();

    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    const result = deleteBackupFile(config, 'backup-2026-05-07T02-00-00Z.sqlite');

    expect(result.success).toBe(true);
    expect(unlinkSpy).toHaveBeenCalledWith(
      path.join(config.destinationPath, 'backup-2026-05-07T02-00-00Z.sqlite')
    );
  });

  it('returns a server error category when a filesystem error occurs', () => {
    const config = createValidConfig();

    const permissionError = new Error('EPERM: operation not permitted') as NodeJS.ErrnoException;
    permissionError.code = 'EPERM';
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw permissionError;
    });

    const result = deleteBackupFile(config, 'backup-2026-05-07T02-00-00Z.sqlite');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to delete file');
    expect(result.errorCategory).toBe('server');
  });
});
