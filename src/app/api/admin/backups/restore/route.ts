import { NextRequest, NextResponse } from 'next/server';
import { loadBackupConfig } from '@/lib/backup/config';
import { restoreFromBackup } from '@/lib/backup';

// POST /api/admin/backups/restore
// Restores the database from a specified backup file. Creates a pre-restore
// safety snapshot before overwriting the current database so the administrator
// can recover if the restore causes issues.
//
// Request body: { "filename": "backup-2026-05-07T02-00-00Z.sqlite" }
export async function POST(request: NextRequest) {
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

  let body: { filename?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { filename } = body;

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json(
      { error: 'The "filename" field is required and must be a string' },
      { status: 400 }
    );
  }

  const result = await restoreFromBackup(config, filename);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, safetySnapshotFilename: result.safetySnapshotFilename },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    safetySnapshotFilename: result.safetySnapshotFilename,
  });
}
