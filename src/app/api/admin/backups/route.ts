import { NextResponse } from 'next/server';
import { loadBackupConfig } from '@/lib/backup/config';
import { listBackups, performManualBackup } from '@/lib/backup';

// GET /api/admin/backups
// Returns the list of all backup files with metadata (filename, size,
// timestamp, type) sorted in reverse chronological order (newest first).
export async function GET() {
  const config = loadBackupConfig();

  if (!config) {
    return NextResponse.json(
      {
        error:
          'Backup system is not configured. Ensure BACKUP_DESTINATION_PATH, ' +
          'BACKUP_CRON_SCHEDULE, and BACKUP_RETENTION_DAYS environment variables are set',
      },
      { status: 503 }
    );
  }

  const backups = listBackups(config);

  return NextResponse.json(backups);
}

// POST /api/admin/backups
// Triggers an immediate manual backup of the database outside the normal
// automatic schedule. Returns the filename of the newly created backup on success
export async function POST() {
  const config = loadBackupConfig();

  if (!config) {
    return NextResponse.json(
      {
        error:
          'Backup system is not configured. Ensure BACKUP_DESTINATION_PATH, ' +
          'BACKUP_CRON_SCHEDULE, and BACKUP_RETENTION_DAYS environment variables are set',
      },
      { status: 503 }
    );
  }

  const filename = await performManualBackup(config);

  if (!filename) {
    return NextResponse.json(
      { error: 'Manual backup failed. Check the server logs for details' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, filename });
}
