/**
 * Structured logging for the backup system.
 *
 * Outputs JSON-formatted log entries to standard output prefixed with
 * [Backup] for easy identification. The structured format enables future
 * administrator user interface consumption (parsing timestamps, event types
 * and metadata from process output or a log aggregator).
 *
 * Optional environment variable: `BACKUP_LOGS_PATH`.
 * When set, the application writes failure events as .log files directly
 * to the directory specified by `BACKUP_LOGS_PATH`.
 */

import fs from 'node:fs';
import path from 'node:path';

export type BackupEventType = 'scheduled' | 'success' | 'failure' | 'retention-cleanup' | 'warning';

export type FailureLogCategory = 'backup' | 'restore';

export interface BackupLogEntry {
  /** ISO-8601 UTC timestamp of the log event. */
  timestamp: string;

  /** Category of the backup event. */
  event: BackupEventType;

  /** Human-readable description of what happened. */
  message: string;

  /** Optional additional data (for example: file path, file size and error details). */
  metadata?: Record<string, unknown>;
}

function generateFilenameTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/:/g, '-') + 'Z';
}

function resolveLogsDirectoryPath(): string {
  // Allow an explicit logs directory to be configured via environment
  // variable `BACKUP_LOGS_PATH`. This is useful when the process is
  // started from a different working directory (for example containers
  // or systemd services) and you want logs written to a predictable
  // location. If the variable is not set, fall back to a `logs` folder
  // inside the current working directory to preserve existing behavior.
  const configured = process.env.BACKUP_LOGS_PATH?.trim();
  if (configured) {
    if (!path.isAbsolute(configured)) {
      console.warn(
        `[Backup] BACKUP_LOGS_PATH "${configured}" is a relative path and will be ignored. ` +
          `Provide an absolute path (e.g. /var/log/myapp) to ensure logs are written to a predictable location.`
      );
    } else {
      return configured;
    }
  }

  return path.resolve(process.cwd(), 'logs');
}

/**
 * Creates a dedicated failure log file for backup or restore errors.
 *
 * The filename follows the same timestamp format used by backup files so
 * that people can easily correlate backups and failures chronologically.
 */
export function writeFailureLogFile(
  category: FailureLogCategory,
  failureReason: string,
  metadata?: Record<string, unknown>
): string | null {
  const timestamp = new Date().toISOString();
  const fileName = `${category}-failure-${generateFilenameTimestamp()}.log`;
  const logsDirectoryPath = resolveLogsDirectoryPath();
  const filePath = path.join(logsDirectoryPath, fileName);

  const fileContents = [
    category === 'backup' ? 'Database Backup Failure Log' : 'Database Restore Failure Log',
    '===========================================',
    `Timestamp (UTC): ${timestamp}`,
    `Operation: ${category === 'backup' ? 'Database backup' : 'Database restore'}`,
    `Failure Reason: ${failureReason}`,
    '',
    'Failure Context (JSON):',
    metadata ? JSON.stringify(metadata, null, 2) : 'No additional failure context was available.',
    '',
    'Troubleshooting Guidance:',
    '1. Verify file and folder paths are correct and accessible.',
    '2. Confirm permissions allow reading and writing required files.',
    '3. Review recent infrastructure or storage changes around this timestamp.',
    '4. Cross-check this failure with console and server logs for the same time.',
    '',
  ].join('\n');

  try {
    fs.mkdirSync(logsDirectoryPath, { recursive: true });
    fs.writeFileSync(filePath, fileContents, 'utf-8');
    return filePath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Backup] Failed to write ${category} failure log file: ${errorMessage}`);
    return null;
  }
}

/**
 * Writes a structured log entry to standard output.
 *
 * Each line is a JSON object preceded by the [Backup] prefix so that it
 * can be easily filtered from other application logs.
 */
export function logBackupEvent(
  event: BackupEventType,
  message: string,
  metadata?: Record<string, unknown>,
  category: FailureLogCategory = 'backup'
): void {
  const entry: BackupLogEntry = {
    timestamp: new Date().toISOString(),
    event,
    message,
    ...(metadata ? { metadata } : {}),
  };

  console.log(`[Backup] ${JSON.stringify(entry)}`);

  if (event === 'failure') {
    writeFailureLogFile(category, message, {
      backupEventTimestamp: entry.timestamp,
      ...(metadata ?? {}),
    });
  }
}
