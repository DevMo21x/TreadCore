import { NextRequest, NextResponse } from 'next/server';
import { loadBackupConfig } from '@/lib/backup/config';
import { deleteBackupFile } from '@/lib/backup';

// DELETE /api/admin/backups/[filename]
// Deletes a single backup file from the backup destination directory.
// The filename is validated against recognized patterns to prevent path
// traversal or accidental deletion of unrelated files
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
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

  const { filename } = await params;

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'A valid backup filename is required' }, { status: 400 });
  }

  const result = deleteBackupFile(config, filename);

  if (!result.success) {
    // Use 400 for validation errors (bad filename or file not found) and
    // 500 for server-side failures (permissions or filesystem errors)
    const statusCode = result.errorCategory === 'server' ? 500 : 400;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ success: true });
}
