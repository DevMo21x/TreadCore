/**
 * Backup configuration module
 *
 * Reads and validates environment variables required for the automated
 * database backup system. Returns a typed configuration object when all
 * required variables are present or null when any are missing (allowing
 * the application to skip scheduling gracefully).
 */

export interface BackupConfig {
  /** Absolute path to the USB device/drive backup folder */
  destinationPath: string;

  /** Cron expression defining the backup frequency (for example "0 2 * * *" for 2am daily) */
  cronSchedule: string;

  /** Number of days to retain backup files before automatic deletion */
  retentionDays: number;

  /** Path to the SQLite database file to back up */
  databasePath: string;
}

/**
 * Attempts to load backup configuration from environment variables
 *
 * Required variables:
 *  - BACKUP_DESTINATION_PATH - Path to USB backup folder.
 *  - BACKUP_CRON_SCHEDULE   - Cron expression for backup frequency.
 *  - BACKUP_RETENTION_DAYS  - Number of days to keep backups.
 *
 * Optional (with default):
 *  - DATABASE_PATH - Path to SQLite file (defaults to "sqlite.db").
 *
 * @returns A validated BackupConfig object or null if any required variable is missing
 */
export function loadBackupConfig(): BackupConfig | null {
  const destinationPath = process.env.BACKUP_DESTINATION_PATH?.trim();
  const cronSchedule = process.env.BACKUP_CRON_SCHEDULE?.trim();
  const retentionDaysRaw = process.env.BACKUP_RETENTION_DAYS?.trim();
  const databasePath = process.env.DATABASE_PATH?.trim() || 'sqlite.db';

  const missingVariables: string[] = [];

  if (!destinationPath) {
    missingVariables.push('BACKUP_DESTINATION_PATH');
  }

  if (!cronSchedule) {
    missingVariables.push('BACKUP_CRON_SCHEDULE');
  }

  if (!retentionDaysRaw) {
    missingVariables.push('BACKUP_RETENTION_DAYS');
  }

  if (missingVariables.length > 0) {
    return null;
  }

  const retentionDays = parseInt(retentionDaysRaw!, 10);

  if (Number.isNaN(retentionDays) || retentionDays < 1) {
    return null;
  }

  return {
    destinationPath: destinationPath!,
    cronSchedule: cronSchedule!,
    retentionDays,
    databasePath,
  };
}
