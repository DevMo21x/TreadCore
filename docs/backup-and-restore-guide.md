# Backup and Restore Guide

## Purpose and Audience

This guide explains the full backup and restore workflow for:

- Administrators who need to create, restore, and delete backup files.
- Developers who need to maintain or extend the backup and restore implementation.

This project stores backups as SQLite database files in a backup destination directory, which is often a mounted Universal Serial Bus device or drive.

## Quick Summary

- Automatic backups are scheduled when the server starts.
- Administrators can create a manual backup from the Admin Backups page.
- Administrators can restore from an existing backup using the Admin Backups page.
- Administrators can also restore from the terminal using the restore script.
- Every restore creates a pre-restore safety snapshot first.

## Architecture Map

| Area | Responsibility |
| --- | --- |
| `src/instrumentation.ts` | Starts migrations, scans videos, then registers automatic backup scheduling at server startup. |
| `src/lib/backup/config.ts` | Reads and validates backup environment variables. |
| `src/lib/backup/index.ts` | Core backup logic: schedule, automatic backup, manual backup, list, restore, delete, retention cleanup. |
| `src/lib/backup/logger.ts` | Structured backup log entries to standard output with a `[Backup]` prefix. |
| `src/app/admin/backups/page.tsx` | Administrator page for listing, creating, restoring, and deleting backups. |
| `src/app/api/admin/backups/route.ts` | List backups and create a manual backup. |
| `src/app/api/admin/backups/restore/route.ts` | Restore database from a selected backup file. |
| `src/app/api/admin/backups/[filename]/route.ts` | Delete a selected backup file. |
| `scripts/restore.ts` | CLI restore workflow with explicit confirmation prompt. |

## Environment Variables

| Variable | Required | Meaning | Example |
| --- | --- | --- | --- |
| `BACKUP_DESTINATION_PATH` | Yes | Directory where backup files and pre-restore snapshots are stored. | Linux: `/media/usb/backups` Windows: `E:\backups` |
| `BACKUP_CRON_SCHEDULE` | Yes (automatic scheduler) | Five-field cron schedule for automatic backups. | `0 2 * * *` |
| `BACKUP_RETENTION_DAYS` | Yes (automatic scheduler) | Number of days to keep automatic backup files before cleanup. | `30` |
| `DATABASE_PATH` | Optional | Database file to back up and restore. Defaults to `sqlite.db`. | `./data/app.db` |
| `BACKUP_LOGS_PATH` | Optional | Optional directory path. When set, the application writes failure log files directly to this directory. | `/var/log/smart-treadmill/backups` |

Important behavior:

- Automatic scheduling is skipped when one or more required scheduler variables are missing or invalid.
- `DATABASE_PATH` is optional and defaults to `sqlite.db`.

## Backup File Types and Naming

The system recognizes these filename patterns:

- `backup-YYYY-MM-DDTHH-mm-ssZ.sqlite` for automatic scheduled backups.
- `manual-backup-YYYY-MM-DDTHH-mm-ssZ.sqlite` for administrator-triggered manual backups.
- `pre-restore-YYYY-MM-DDTHH-mm-ssZ.sqlite` for safety snapshots made before a restore.

The timestamp is Coordinated Universal Time and is encoded with hyphens in place of colons to keep filenames valid on common file systems.

## Automatic Backup Flow

1. Server startup triggers `register` in `src/instrumentation.ts`.
2. Migrations run first, then video scanning runs, then `scheduleBackup` is called.
3. `scheduleBackup` loads backup configuration and validates the cron expression.
4. At each scheduled time:
   - `performBackup` opens the source database in read-only mode and writes a backup file.
   - If backup succeeds, `cleanupOldBackups` removes expired automatic backup files.
5. The system writes structured log events for scheduled, success, warning, failure, and retention cleanup events.

Important retention detail:

- Automatic retention cleanup only deletes files that match the `backup-...` pattern.
- Manual backup files and pre-restore snapshot files are not automatically removed by retention cleanup.

## Manual Backup from the Administrator Page

Path: `/admin/backups`

When an administrator selects Backup Now:

1. The page sends `POST /api/admin/backups`.
2. The route loads configuration with `loadBackupConfig`.
3. `performManualBackup` creates a `manual-backup-...` file.
4. The page refreshes the list and displays a success or error message.

## Restore from the Administrator Page

Path: `/admin/backups`

When an administrator restores from a selected file:

1. The page shows a confirmation dialog.
2. The page sends `POST /api/admin/backups/restore` with `{ "filename": "..." }`.
3. `restoreFromBackup` validates the filename pattern.
4. `restoreFromBackup` creates a `pre-restore-...` safety snapshot.
5. `restoreFromBackup` copies the selected backup file over the active database.
6. The page displays the safety snapshot filename and refreshes the table.

## Restore from the CLI

Use this when working directly on the server:

```bash
pnpm db:restore -- --file /media/usb/backups/backup-2026-05-07T02-00-00Z.sqlite
```

The script in `scripts/restore.ts` performs these checks and actions:

1. Validates the `--file` argument.
2. Validates that the selected backup file exists and is readable.
3. Validates that the current database file exists.
4. Validates that `BACKUP_DESTINATION_PATH` exists.
5. Shows a warning panel and requires exact text confirmation: `CONFIRM`.
6. Creates a `pre-restore-...` safety snapshot.
7. Copies the selected backup file over the active database.

If confirmation is not exactly `CONFIRM`, the restore is cancelled and no changes are made.

## Delete Backup File

Endpoint: `DELETE /api/admin/backups/[filename]`

- The filename must match a recognized backup pattern.
- Nonexistent files and invalid names are returned as client errors.
- Permission and file system errors are returned as server errors.

## Logging and Observability

Backup events are written as structured JavaScript Object Notation with a `[Backup]` prefix.

Example log line:

```text
[Backup] {"timestamp":"2026-05-22T02:00:00.000Z","event":"success","message":"Database backed up successfully to backup-2026-05-22T02-00-00Z.sqlite.","metadata":{"fileSizeInMegabytes":"8.21"}}
```

Use these logs to trace scheduling, backup success, restore success, retention cleanup, and failures.

Optional persistence:

Set the optional environment variable `BACKUP_LOGS_PATH` to a directory path. When set, the application writes failure log files directly to that directory.

## Safety and Security Notes

- Filename validation blocks path traversal attempts.
- Restore always creates a safety snapshot before overwrite.
- Automatic backup opens the source database in read-only mode.
- Backup files are regular SQLite files and are not encrypted by default.
- Protect the backup destination with operating system permissions and physical access controls.

## Troubleshooting

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Backup scheduling skipped warning | Required scheduler environment variable is missing or invalid | Set `BACKUP_DESTINATION_PATH`, `BACKUP_CRON_SCHEDULE`, and `BACKUP_RETENTION_DAYS` correctly and restart server |
| Invalid cron schedule warning | Cron expression format is incorrect | Use a valid five-field cron expression |
| Manual backup fails | Destination path is not writable or source database cannot be read | Verify file permissions and mount status |
| Restore fails before copy | Backup file missing, invalid filename, or safety snapshot creation failed | Verify selected filename, source file permissions, and destination path permissions |
| Restore completes but app behaves unexpectedly | In-flight writes were active during restore | Restart application process after restore |

## Verification and Tests

Backup and restore behavior is covered by these tests:

- `__tests__/lib/backup.test.ts`
- `__tests__/api/backups.test.ts`
- `__tests__/scripts/restore.test.ts`

Run only backup and restore related tests:

```bash
pnpm test -- --run __tests__/lib/backup.test.ts __tests__/api/backups.test.ts __tests__/scripts/restore.test.ts
```

## Operational Checklist

Before production use:

1. Confirm all required environment variables are set.
2. Confirm backup destination path is mounted and writable.
3. Confirm scheduled backups are appearing with expected timestamps.
4. Perform a non-production restore drill and verify data integrity.
5. Confirm staff know where pre-restore safety snapshots are stored.
