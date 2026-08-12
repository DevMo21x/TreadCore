/**
 * Automated database backup service.
 *
 * Provides functions to:
 *  - Perform a safe backup of the SQLite database using the Online Backup API.
 *  - Cleanup old backups beyond the configured retention period.
 *  - Schedule recurring backups via node-cron.
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { loadBackupConfig, type BackupConfig } from './config';
import { logBackupEvent } from './logger';
import cron from 'node-cron';

function generateTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, 'Z');
}

function isDestinationAccessible(destinationPath: string): boolean {
  try {
    fs.accessSync(destinationPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Performs a single backup of the SQLite database to the configured destination
 * path. Opens the source database in READ-ONLY mode via the SQLite Online Backup
 * API to avoid interfering with concurrent writers and to prevent taking
 * long-lived write locks on the production database.
 */
export async function performBackup(config: BackupConfig): Promise<boolean> {
  const { destinationPath, databasePath } = config;

  if (!isDestinationAccessible(destinationPath)) {
    logBackupEvent('failure', 'Backup destination path does not exist or is not writable.', {
      destinationPath,
    });
    return false;
  }

  const resolvedDatabasePath = path.resolve(databasePath);

  try {
    fs.accessSync(resolvedDatabasePath, fs.constants.R_OK);
  } catch {
    logBackupEvent('failure', 'Source database file does not exist or is not readable', {
      databasePath: resolvedDatabasePath,
    });
    return false;
  }

  const timestamp = generateTimestamp();
  const backupFileName = `backup-${timestamp}.sqlite`;
  const backupFilePath = path.join(destinationPath, backupFileName);

  try {
    const sourceDatabase = new Database(resolvedDatabasePath, { readonly: true });

    try {
      await sourceDatabase.backup(backupFilePath);
    } finally {
      sourceDatabase.close();
    }

    const fileStats = fs.statSync(backupFilePath);
    const fileSizeInMegabytes = (fileStats.size / (1024 * 1024)).toFixed(2);

    logBackupEvent('success', `Database backed up successfully to ${backupFileName}.`, {
      filePath: backupFilePath,
      fileSizeInMegabytes,
      sourceDatabase: resolvedDatabasePath,
    });

    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBackupEvent('failure', 'Database backup failed unexpectedly.', {
      error: errorMessage,
      destinationPath: backupFilePath,
      sourceDatabase: resolvedDatabasePath,
    });

    return false;
  }
}

/**
 * Removes backup files older than the configured retention period. Only
 * called after a successful backup — if the backup destination is temporarily
 * unavailable we must not delete existing backups that may be the only
 * available copies.
 */
export function cleanupOldBackups(config: BackupConfig): void {
  const { destinationPath, retentionDays } = config;

  if (!isDestinationAccessible(destinationPath)) {
    logBackupEvent(
      'warning',
      'Cannot perform retention cleanup - destination path is not accessible.',
      {
        destinationPath,
      }
    );
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let files: string[];

  try {
    files = fs.readdirSync(destinationPath);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBackupEvent('failure', 'Failed to read backup destination directory for cleanup.', {
      error: errorMessage,
      destinationPath,
    });
    return;
  }

  // Retention cleanup intentionally targets only automatically scheduled backups.
  // Manual and pre-restore files are preserved until an administrator deletes them.
  const backupFilePattern = /^backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.sqlite$/;

  for (const fileName of files) {
    const match = fileName.match(backupFilePattern);

    if (!match) continue;

    const rawTimestamp = match[1];
    const isoTimestamp = rawTimestamp.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z');

    const fileDate = new Date(isoTimestamp);
    if (Number.isNaN(fileDate.getTime())) continue;

    if (fileDate < cutoffDate) {
      const filePath = path.join(destinationPath, fileName);
      try {
        fs.unlinkSync(filePath);
        logBackupEvent('retention-cleanup', `Deleted expired backup: ${fileName}`, {
          filePath,
          fileDate: fileDate.toISOString(),
          retentionDays,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logBackupEvent('failure', `Failed to delete expired backup: ${fileName}`, {
          error: errorMessage,
          filePath,
        });
      }
    }
  }
}

/**
 * Initializes the automated backup scheduler. Intended to be called once at
 * server startup (e.g. from `instrumentation.ts`). Calling it more than once
 * will register duplicate cron jobs; the caller must ensure it is only
 * invoked once per process.
 */
export function scheduleBackup(): void {
  const requiredEnvironmentVariables = [
    'BACKUP_DESTINATION_PATH',
    'BACKUP_CRON_SCHEDULE',
    'BACKUP_RETENTION_DAYS',
  ] as const;

  const missingRequiredEnvironmentVariables = requiredEnvironmentVariables.filter(
    (variableName) => !process.env[variableName]?.trim()
  );

  const retentionDaysRaw = process.env.BACKUP_RETENTION_DAYS?.trim();
  const retentionDaysParsed = retentionDaysRaw ? Number.parseInt(retentionDaysRaw, 10) : null;
  const hasInvalidRetentionDays =
    !!retentionDaysRaw &&
    (retentionDaysParsed === null || Number.isNaN(retentionDaysParsed) || retentionDaysParsed < 1);

  const config = loadBackupConfig();
  if (!config) {
    // Capture configuration issues in a persistent log file to help troubleshooting
    // when backups never start due to missing or invalid environment variables.
    logBackupEvent(
      'failure',
      'Backup scheduling failed because one or more required environment variables are missing or invalid. Required: BACKUP_DESTINATION_PATH, BACKUP_CRON_SCHEDULE, BACKUP_RETENTION_DAYS.',
      {
        requiredEnvironmentVariables: [...requiredEnvironmentVariables],
        missingRequiredEnvironmentVariables,
        invalidEnvironmentVariables: hasInvalidRetentionDays ? ['BACKUP_RETENTION_DAYS'] : [],
      }
    );
    return;
  }

  if (!cron.validate(config.cronSchedule)) {
    logBackupEvent(
      'warning',
      'Backup scheduling skipped - BACKUP_CRON_SCHEDULE is not a valid cron expression.',
      {
        cronSchedule: config.cronSchedule,
      }
    );
    return;
  }

  const job = async () => {
    const success = await performBackup(config);
    if (success) cleanupOldBackups(config);
  };

  try {
    cron.schedule(config.cronSchedule, job);
    logBackupEvent('scheduled', 'Automated database backup has been scheduled.', {
      cronSchedule: config.cronSchedule,
      destinationPath: config.destinationPath,
      retentionDays: config.retentionDays,
      databasePath: config.databasePath,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logBackupEvent('failure', 'Failed to schedule automated database backup.', {
      error: errorMessage,
      cronSchedule: config.cronSchedule,
    });
  }
}

// ─── Backup File Metadata ────────────────────────────────────────────────────

/**
 * Represents a single backup file's metadata for display in the
 * administrator user interface.
 */
export interface BackupFileInfo {
  /** The filename on disk (for example "backup-2026-05-07T02-00-00Z.sqlite"). */
  filename: string;

  /** File size in bytes. */
  sizeInBytes: number;

  /** ISO-8601 UTC timestamp parsed from the filename. */
  timestamp: string;

  /** How this backup was created. */
  type: 'automatic' | 'manual' | 'pre-restore';
}

/**
 * Recognized filename patterns for backup files stored in the destination
 * directory. Each pattern captures the timestamp portion of the filename
 * and maps to a human-readable type label.
 *
 * IMPORTANT: The "manual-backup-" and "pre-restore-" patterns must appear
 * before the plain "backup-" pattern to avoid a substring match since
 * "backup-" would also match the suffix of "manual-backup-".
 */
const BACKUP_FILE_PATTERNS: { pattern: RegExp; type: BackupFileInfo['type'] }[] = [
  { pattern: /^manual-backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.sqlite$/, type: 'manual' },
  { pattern: /^pre-restore-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.sqlite$/, type: 'pre-restore' },
  { pattern: /^backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.sqlite$/, type: 'automatic' },
];

/**
 * Converts a filename-safe timestamp (hyphens in place of colons) back
 * to a standard ISO-8601 string.
 *
 * Example: "2026-05-07T02-00-00Z" becomes "2026-05-07T02:00:00Z".
 */
function filenameTimestampToIso(raw: string): string {
  return raw.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z');
}

/**
 * Checks whether a filename matches one of the recognized backup file
 * patterns. Returns true only for filenames that are safe to operate on
 * (prevents path traversal and accidental deletion of unrelated files).
 */
export function isValidBackupFilename(filename: string): boolean {
  return BACKUP_FILE_PATTERNS.some(({ pattern }) => pattern.test(filename));
}

// ─── List Backups ────────────────────────────────────────────────────────────

/**
 * Reads the backup destination directory and returns metadata for every
 * recognized backup file, sorted in reverse chronological order (newest first).
 *
 * Returns an empty array if the destination is not accessible or contains
 * no backup files. Never throws.
 */
export function listBackups(config: BackupConfig): BackupFileInfo[] {
  const { destinationPath } = config;

  if (!isDestinationAccessible(destinationPath)) {
    return [];
  }

  let filenames: string[];

  try {
    filenames = fs.readdirSync(destinationPath);
  } catch {
    return [];
  }

  const backups: BackupFileInfo[] = [];

  for (const filename of filenames) {
    for (const { pattern, type } of BACKUP_FILE_PATTERNS) {
      const match = filename.match(pattern);

      if (!match) {
        continue;
      }

      const isoTimestamp = filenameTimestampToIso(match[1]);
      const parsedDate = new Date(isoTimestamp);

      if (Number.isNaN(parsedDate.getTime())) {
        continue;
      }

      try {
        const filePath = path.join(destinationPath, filename);
        const fileStats = fs.statSync(filePath);

        backups.push({
          filename,
          sizeInBytes: fileStats.size,
          timestamp: isoTimestamp,
          type,
        });
      } catch {
        // Skip files that cannot be read (for example permission issues)
      }

      break;
    }
  }

  // Sort newest first (reverse chronological order)
  backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return backups;
}

// ─── Manual Backup ───────────────────────────────────────────────────────────

/**
 * Performs an immediate manual backup of the SQLite database. Works
 * identically to the scheduled backup but uses the "manual-backup-" prefix
 * in the filename so that the administrator user interface can distinguish
 * manually triggered backups from automatically scheduled ones.
 *
 * Returns the filename of the new backup on success, or null on failure.
 */
export async function performManualBackup(config: BackupConfig): Promise<string | null> {
  const { destinationPath, databasePath } = config;

  if (!isDestinationAccessible(destinationPath)) {
    logBackupEvent(
      'failure',
      'Manual backup failed - destination path does not exist or is not writable',
      {
        destinationPath,
      }
    );
    return null;
  }

  const resolvedDatabasePath = path.resolve(databasePath);

  try {
    fs.accessSync(resolvedDatabasePath, fs.constants.R_OK);
  } catch {
    logBackupEvent(
      'failure',
      'Manual backup failed - source database file does not exist or is not readable',
      {
        databasePath: resolvedDatabasePath,
      }
    );
    return null;
  }

  const timestamp = generateTimestamp();
  const backupFileName = `manual-backup-${timestamp}.sqlite`;
  const backupFilePath = path.join(destinationPath, backupFileName);

  try {
    const sourceDatabase = new Database(resolvedDatabasePath, { readonly: true });

    try {
      await sourceDatabase.backup(backupFilePath);
    } finally {
      sourceDatabase.close();
    }

    const fileStats = fs.statSync(backupFilePath);
    const fileSizeInMegabytes = (fileStats.size / (1024 * 1024)).toFixed(2);

    logBackupEvent('success', `Manual backup created successfully: ${backupFileName}`, {
      filePath: backupFilePath,
      fileSizeInMegabytes,
      sourceDatabase: resolvedDatabasePath,
      triggeredBy: 'administrator',
    });

    return backupFileName;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBackupEvent('failure', 'Manual backup failed unexpectedly', {
      error: errorMessage,
      destinationPath: backupFilePath,
      sourceDatabase: resolvedDatabasePath,
    });

    return null;
  }
}

// ─── Restore from Backup ─────────────────────────────────────────────────────

/**
 * Result object returned by the restoreFromBackup function.
 */
export interface RestoreResult {
  success: boolean;
  safetySnapshotFilename?: string;
  error?: string;
}

/**
 * Restores the database from a given backup file in the destination directory.
 * Before overwriting the current database, a safety snapshot is created with
 * the "pre-restore-" prefix so that the administrator can recover if needed.
 *
 * Uses asynchronous file operations to avoid blocking the event loop during
 * large file copies. This function shares the same logic as the Command Line
 * Interface restore script to ensure consistent behaviour across both interfaces.
 *
 * Confirmation is handled by the caller (for example the administrator page
 * dialog). This function focuses on safe file operations and recovery snapshot
 * creation.
 */
export async function restoreFromBackup(
  config: BackupConfig,
  filename: string
): Promise<RestoreResult> {
  const { destinationPath, databasePath } = config;
  const resolvedDatabasePath = path.resolve(databasePath);

  // Validate the filename against recognized patterns to prevent path traversal
  if (!isValidBackupFilename(filename)) {
    logBackupEvent(
      'failure',
      'Restore request failed because the provided filename is not a recognized backup file.',
      {
        providedFilename: filename,
        destinationPath,
        databasePath: resolvedDatabasePath,
      },
      'restore'
    );

    return { success: false, error: 'The provided filename is not a recognized backup file.' };
  }

  const backupFilePath = path.join(destinationPath, filename);

  // Verify the backup file exists
  if (!fs.existsSync(backupFilePath)) {
    logBackupEvent(
      'failure',
      'Restore failed because the selected backup file does not exist.',
      {
        providedFilename: filename,
        backupFilePath,
        destinationPath,
      },
      'restore'
    );

    return { success: false, error: `Backup file does not exist: ${filename}` };
  }

  // Verify the current database exists
  if (!fs.existsSync(resolvedDatabasePath)) {
    logBackupEvent(
      'failure',
      'Restore failed because the current database file does not exist at the configured path.',
      {
        databasePath: resolvedDatabasePath,
        destinationPath,
      },
      'restore'
    );

    return {
      success: false,
      error: 'Current database file does not exist. Ensure DATABASE_PATH is set correctly.',
    };
  }

  // Create a safety snapshot before overwriting
  const timestamp = generateTimestamp();
  const safetySnapshotFilename = `pre-restore-${timestamp}.sqlite`;
  const safetySnapshotPath = path.join(destinationPath, safetySnapshotFilename);

  try {
    await fs.promises.copyFile(resolvedDatabasePath, safetySnapshotPath);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBackupEvent(
      'failure',
      'Failed to create safety snapshot before restore',
      {
        error: errorMessage,
        safetySnapshotPath,
        backupFile: backupFilePath,
        databasePath: resolvedDatabasePath,
      },
      'restore'
    );

    return { success: false, error: `Failed to create safety snapshot: ${errorMessage}` };
  }

  // Overwrite the current database with the backup file
  try {
    await fs.promises.copyFile(backupFilePath, resolvedDatabasePath);

    logBackupEvent('success', `Database restored successfully from ${filename}`, {
      backupFile: backupFilePath,
      safetySnapshot: safetySnapshotPath,
      databasePath: resolvedDatabasePath,
      triggeredBy: 'administrator',
    });

    return { success: true, safetySnapshotFilename };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBackupEvent(
      'failure',
      'Database restore failed',
      {
        error: errorMessage,
        backupFile: backupFilePath,
        safetySnapshot: safetySnapshotPath,
        databasePath: resolvedDatabasePath,
      },
      'restore'
    );

    return {
      success: false,
      safetySnapshotFilename,
      error: `Restore failed: ${errorMessage}. The safety snapshot has been preserved at ${safetySnapshotFilename}`,
    };
  }
}

// ─── Delete Backup ───────────────────────────────────────────────────────────

/**
 * Deletes a single backup file from the destination directory.
 * The filename is validated against recognized patterns to prevent
 * path traversal or accidental deletion of unrelated files.
 *
 * The returned "errorCategory" field allows the calling route handler
 * to distinguish between client errors (bad input) and server errors
 * (file system failures) for correct HTTP status codes.
 */
export function deleteBackupFile(
  config: BackupConfig,
  filename: string
): { success: boolean; error?: string; errorCategory?: 'validation' | 'server' } {
  const { destinationPath } = config;

  if (!isValidBackupFilename(filename)) {
    return {
      success: false,
      error: 'The provided filename is not a recognized backup file',
      errorCategory: 'validation',
    };
  }

  const filePath = path.join(destinationPath, filename);

  // Attempt to delete directly rather than checking existence first which
  // avoids a time-of-check-to-time-of-use (TOCTOU) race condition where
  // the file could be removed between the existence check and the unlink
  try {
    fs.unlinkSync(filePath);

    logBackupEvent('retention-cleanup', `Backup file deleted by administrator: ${filename}`, {
      filePath,
      triggeredBy: 'administrator',
    });

    return { success: true };
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;

    // If the file was already absent then report it as a validation-level error
    if (nodeError.code === 'ENOENT') {
      return {
        success: false,
        error: `Backup file does not exist: ${filename}`,
        errorCategory: 'validation',
      };
    }

    // All other failures (permissions, read-only filesystem etc) are server errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBackupEvent('failure', `Failed to delete backup file: ${filename}`, {
      error: errorMessage,
      filePath,
    });

    return {
      success: false,
      error: `Failed to delete file: ${errorMessage}`,
      errorCategory: 'server',
    };
  }
}
