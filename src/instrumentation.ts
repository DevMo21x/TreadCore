export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./db/migrate');
    runMigrations();

    const { scanVideos } = await import('./lib/video/scanVideos');
    await scanVideos();

    // Initialize the automated database backup scheduler.
    // This must run after migrations so that the database file exists
    const { scheduleBackup } = await import('./lib/backup');
    scheduleBackup();
  }
}
