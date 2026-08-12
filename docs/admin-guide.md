# Admin Dashboard Guide

## What Is the Admin Dashboard?

The admin dashboard at `/admin/dashboard` provides a management interface for users with admin privileges. It's where admins can view analytics, manage users, moderate content, and configure the application.

## Offline Support Contact

This app can show an admin contact email on the public home screen for users who forgot their PIN and cannot sign in.

- Configure the email with `ADMIN_EMAIL` in your deployment environment or local `.env.local` file.
- This is a server-only variable — changing it only requires a server restart, not a rebuild.
- The treadmill is expected to be offline, so the app only reveals the email as text on-screen.
- Users then contact the admin from their phone; the app does not send mail and does not provide an in-app contact form.

Example:

```env
ADMIN_EMAIL=admin@example.com
```

If this value is left empty, the home screen will show a fallback message telling staff to configure admin contact information.

## Backup and Restore Operations

The administrator backups page is available at `/admin/backups`.

You can use this page to:

- Create a manual backup immediately.
- Restore the active database from a selected backup file.
- Delete old backup files that are no longer needed.

### Safe Restore Checklist

Before selecting Restore:

1. Confirm the selected backup timestamp is the one you intend to use.
2. Avoid active write operations during restore.
3. Notify affected users that data state will be rolled back to the selected backup time.

When restore runs, the system always creates a pre-restore safety snapshot first. This safety snapshot allows recovery if the selected restore file is not the intended one.

After restore completes, restart the application process if write requests were active during the operation.

### Troubleshooting for Administrators

- If the page says backup system is not configured, contact a developer to verify backup environment variables.
- If Backup Now fails, verify that the backup destination storage is mounted and writable.
- If restore fails, do not delete the generated pre-restore safety snapshot.

- To inspect backup activity and errors, check application logs for lines prefixed with `[Backup]`. If you have set `BACKUP_LOGS_PATH`, the application writes failure log files directly to that directory — inspect the files there.

For complete technical details for both administrators and developers, see [docs/backup-and-restore-guide.md](backup-and-restore-guide.md).
