/**
 * Database Restore CLI Script
 *
 * Restores the SQLite database from a previously created backup file.
 * Before overwriting, a safety snapshot of the current database is saved
 * to the backup destination path so that the administrator can recover
 * if the restore itself causes issues.
 *
 * Usage:
 *   pnpm db:restore -- --file <path-to-backup>
 *
 * Environment variables:
 *   DATABASE_PATH             — Path to the current SQLite database (defaults to "sqlite.db").
 *   BACKUP_DESTINATION_PATH   — Path where the safety snapshot will be saved.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { logBackupEvent } from '../src/lib/backup/logger';

// ─── Argument Parsing ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArgIndex = args.indexOf('--file');

if (fileArgIndex === -1 || !args[fileArgIndex + 1]) {
  logBackupEvent(
    'failure',
    'Restore command did not include the required --file argument.',
    {
      providedArguments: args,
      script: 'scripts/restore.ts',
    },
    'restore'
  );

  console.error(
    '\n  Usage: pnpm db:restore -- --file <path-to-backup>\n\n' +
      '  Example:\n' +
      '    pnpm db:restore -- --file /media/usb/backups/backup-2026-05-07T02-00-00Z.sqlite\n'
  );
  process.exit(1);
}

const backupFilePath = path.resolve(args[fileArgIndex + 1]);

// ─── Configuration ───────────────────────────────────────────────────────────

const databasePath = path.resolve(process.env.DATABASE_PATH || 'sqlite.db');
const backupDestinationPath = process.env.BACKUP_DESTINATION_PATH?.trim();

// ─── Validation ──────────────────────────────────────────────────────────────

// Verify the backup file exists and is readable
if (!fs.existsSync(backupFilePath)) {
  logBackupEvent(
    'failure',
    'Backup file does not exist.',
    {
      backupFilePath,
      databasePath,
      backupDestinationPath: backupDestinationPath ?? 'Not configured',
      stage: 'validation',
      script: 'scripts/restore.ts',
    },
    'restore'
  );

  console.error(`\n  Error: Backup file does not exist: ${backupFilePath}\n`);
  process.exit(1);
}

try {
  fs.accessSync(backupFilePath, fs.constants.R_OK);
} catch {
  logBackupEvent(
    'failure',
    'Backup file is not readable.',
    {
      backupFilePath,
      databasePath,
      backupDestinationPath: backupDestinationPath ?? 'Not configured',
      stage: 'validation',
      script: 'scripts/restore.ts',
    },
    'restore'
  );

  console.error(`\n  Error: Backup file is not readable: ${backupFilePath}\n`);
  process.exit(1);
}

// Verify the current database exists (there must be something to restore over)
if (!fs.existsSync(databasePath)) {
  logBackupEvent(
    'failure',
    'Current database file does not exist at the configured path.',
    {
      backupFilePath,
      databasePath,
      backupDestinationPath: backupDestinationPath ?? 'Not configured',
      stage: 'validation',
      script: 'scripts/restore.ts',
    },
    'restore'
  );

  console.error(
    `\n  Error: Current database file does not exist at: ${databasePath}\n` +
      '  There is nothing to restore over. Ensure DATABASE_PATH is set correctly.\n'
  );
  process.exit(1);
}

// Verify the backup destination is configured for the safety snapshot
// so there is always a rollback file before any overwrite operation.
if (!backupDestinationPath) {
  logBackupEvent(
    'failure',
    'BACKUP_DESTINATION_PATH is not set for restore safety snapshot.',
    {
      backupFilePath,
      databasePath,
      backupDestinationPath: 'Not configured',
      stage: 'validation',
      script: 'scripts/restore.ts',
    },
    'restore'
  );

  console.error(
    '\n  Error: BACKUP_DESTINATION_PATH environment variable is not set.\n' +
      '  A safety snapshot of the current database needs to be saved before restoring.\n' +
      '  Set this variable to the USB device/drive backup folder path.\n'
  );
  process.exit(1);
}

if (!fs.existsSync(backupDestinationPath)) {
  logBackupEvent(
    'failure',
    'Backup destination path does not exist for restore safety snapshot.',
    {
      backupFilePath,
      databasePath,
      backupDestinationPath,
      stage: 'validation',
      script: 'scripts/restore.ts',
    },
    'restore'
  );

  console.error(
    `\n  Error: Backup destination path does not exist: ${backupDestinationPath}\n` +
      '  Ensure the USB device/drive is mounted and BACKUP_DESTINATION_PATH is correct.\n'
  );
  process.exit(1);
}

// ─── Safety Snapshot ─────────────────────────────────────────────────────────

const timestamp = new Date()
  .toISOString()
  .replace(/:/g, '-')
  .replace(/\.\d{3}Z$/, 'Z');
const safetySnapshotFileName = `pre-restore-${timestamp}.sqlite`;
const safetySnapshotPath = path.join(backupDestinationPath, safetySnapshotFileName);

// ─── Confirmation Prompt ─────────────────────────────────────────────────────
// An explicit confirmation phrase is required to prevent accidental restores.

console.log('\n  ╔══════════════════════════════════════════════════════════════╗');
console.log('  ║              DATABASE RESTORE — WARNING                      ║');
console.log('  ╠══════════════════════════════════════════════════════════════╣');
console.log(`  ║  Backup file:      ${backupFilePath}`);
console.log(`  ║  Current database: ${databasePath}`);
console.log(`  ║  Safety snapshot:  ${safetySnapshotPath}`);
console.log('  ║                                                              ║');
console.log('  ║  This will OVERWRITE the current database with the backup.   ║');
console.log('  ║  A safety snapshot will be saved first.                      ║');
console.log('  ╚══════════════════════════════════════════════════════════════╝\n');

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

readlineInterface.question('  Type CONFIRM to proceed with the restore: ', (answer) => {
  readlineInterface.close();

  if (answer.trim() !== 'CONFIRM') {
    console.log('\n  Restore cancelled. No changes were made.\n');
    process.exit(0);
  }

  // ─── Execute Restore ─────────────────────────────────────────────────────

  try {
    // Step 1: Create the safety snapshot of the current database
    console.log(`\n  Creating safety snapshot at: ${safetySnapshotPath}`);
    fs.copyFileSync(databasePath, safetySnapshotPath);
    console.log('  Safety snapshot created successfully.');

    // Step 2: Overwrite the current database with the backup file
    console.log(`  Restoring database from: ${backupFilePath}`);
    fs.copyFileSync(backupFilePath, databasePath);

    console.log('\n  ✓ Database restore completed successfully.');
    console.log('  ✓ A server restart may be needed if any in-flight requests were mid-write.\n');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logBackupEvent(
      'failure',
      'Database restore failed.',
      {
        backupFilePath,
        databasePath,
        backupDestinationPath,
        safetySnapshotPath,
        stage: 'execution',
        error: errorMessage,
        script: 'scripts/restore.ts',
      },
      'restore'
    );

    console.error(`\n  Error: Database restore failed - ${errorMessage}`);
    console.error(`  The safety snapshot has been preserved at: ${safetySnapshotPath}`);
    console.error('  The current database may be in an inconsistent state.\n');
    process.exit(1);
  }
});
