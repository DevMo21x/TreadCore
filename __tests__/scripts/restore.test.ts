import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

/**
 * Integration-style tests for the restore CLI script
 *
 * These tests verify argument parsing and validation logic by spawning
 * the script as a subprocess. The actual filesystem operations (copy and
 * overwrite) are not performed against real databases - instead we verify
 * the script's exit behaviour and output under various conditions.
 */

const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/restore.ts');

// Helper to run the restore script with given arguments and environment
function runRestoreScript(
  args: string[] = [],
  environment: Record<string, string> = {},
  options: { currentWorkingDirectory?: string; standardInput?: string } = {}
): { stdout: string; stderr: string; exitCode: number } {
  // Quote each argument to handle paths containing spaces
  const quotedArgs = args.map((arg) => `"${arg}"`).join(' ');

  try {
    const result = execSync(`pnpx tsx "${SCRIPT_PATH}" ${quotedArgs}`, {
      env: { ...process.env, ...environment },
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...(options.currentWorkingDirectory ? { cwd: options.currentWorkingDirectory } : {}),
      // Pipe "n" to stdin to reject the confirmation prompt if it gets that far
      input: options.standardInput ?? 'n\n',
      timeout: 15000,
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
      exitCode: execError.status || 1,
    };
  }
}

describe('Restore CLI Script', () => {
  // Ensure any temporary files or directories created by these tests are
  // removed after each test run. Tests create files in the repository root
  // (for example `test-backup-temp.sqlite`) to simulate CLI usage; this
  // cleanup prevents stray test artifacts from remaining after success or
  // failure.
  afterEach(() => {
    const repoRoot = path.resolve(__dirname, '../../');

    const candidates = [
      path.join(repoRoot, 'test-backup-temp.sqlite'),
      path.join(repoRoot, 'test-db-temp.sqlite'),
      path.join(repoRoot, 'test-backup-temp2.sqlite'),
      path.join(repoRoot, 'test-db-temp2.sqlite'),
      path.join(repoRoot, 'test-backup-temp3.sqlite'),
      path.join(repoRoot, 'test-db-temp3.sqlite'),
      path.join(repoRoot, 'test-backup-dest'),
      path.join(repoRoot, 'logs'),
    ];

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          const stats = fs.statSync(candidate);
          if (stats.isDirectory()) {
            fs.rmSync(candidate, { recursive: true, force: true });
          } else {
            fs.unlinkSync(candidate);
          }
        }
      } catch {
        // Ignore cleanup failures here — we do not want a cleanup error to
        // mask the original test result. File removal will be retried by
        // the developer locally if required.
      }
    }
  });

  it('exits with an error when --file argument is not provided', () => {
    const result = runRestoreScript([]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Usage');
    expect(result.stderr).toContain('--file');
  });

  it('exits with an error when the backup file does not exist', () => {
    const result = runRestoreScript(['--file', '/nonexistent/backup-file.sqlite'], {
      DATABASE_PATH: 'sqlite.db',
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('does not exist');
  });

  it('exits with an error when BACKUP_DESTINATION_PATH is not set', () => {
    // Create a temporary file to act as the "backup file"
    const tempBackupFile = path.resolve(__dirname, '../../test-backup-temp.sqlite');
    const tempDatabaseFile = path.resolve(__dirname, '../../test-db-temp.sqlite');

    try {
      fs.writeFileSync(tempBackupFile, 'fake backup data');
      fs.writeFileSync(tempDatabaseFile, 'fake database data');

      const result = runRestoreScript(['--file', tempBackupFile], {
        DATABASE_PATH: tempDatabaseFile,
        BACKUP_DESTINATION_PATH: '',
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('BACKUP_DESTINATION_PATH');
    } finally {
      // Cleanup temporary files
      if (fs.existsSync(tempBackupFile)) fs.unlinkSync(tempBackupFile);
      if (fs.existsSync(tempDatabaseFile)) fs.unlinkSync(tempDatabaseFile);
    }
  });

  it('exits with an error when BACKUP_DESTINATION_PATH does not exist on disk', () => {
    const tempBackupFile = path.resolve(__dirname, '../../test-backup-temp2.sqlite');
    const tempDatabaseFile = path.resolve(__dirname, '../../test-db-temp2.sqlite');

    try {
      fs.writeFileSync(tempBackupFile, 'fake backup data');
      fs.writeFileSync(tempDatabaseFile, 'fake database data');

      const result = runRestoreScript(['--file', tempBackupFile], {
        DATABASE_PATH: tempDatabaseFile,
        BACKUP_DESTINATION_PATH: '/nonexistent/usb/path',
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('does not exist');
    } finally {
      if (fs.existsSync(tempBackupFile)) fs.unlinkSync(tempBackupFile);
      if (fs.existsSync(tempDatabaseFile)) fs.unlinkSync(tempDatabaseFile);
    }
  });

  it('cancels the restore when confirmation input is not CONFIRM', () => {
    const tempBackupFile = path.resolve(__dirname, '../../test-backup-temp3.sqlite');
    const tempDatabaseFile = path.resolve(__dirname, '../../test-db-temp3.sqlite');
    const tempDestination = path.resolve(__dirname, '../../test-backup-dest');

    try {
      fs.writeFileSync(tempBackupFile, 'fake backup data');
      fs.writeFileSync(tempDatabaseFile, 'fake database data');
      fs.mkdirSync(tempDestination, { recursive: true });

      // The helper sends "n\n" as stdin which should not match "CONFIRM"
      const result = runRestoreScript(['--file', tempBackupFile], {
        DATABASE_PATH: tempDatabaseFile,
        BACKUP_DESTINATION_PATH: tempDestination,
      });

      // Script should exit cleanly (code 0) with a cancellation message in stdout
      const combinedOutput = result.stdout + result.stderr;
      expect(combinedOutput).toContain('cancelled');
    } finally {
      if (fs.existsSync(tempBackupFile)) fs.unlinkSync(tempBackupFile);
      if (fs.existsSync(tempDatabaseFile)) fs.unlinkSync(tempDatabaseFile);
      if (fs.existsSync(tempDestination)) fs.rmSync(tempDestination, { recursive: true });
    }
  });

  it('creates a restore failure log file when validation fails', () => {
    const temporaryProjectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-log-test-'));
    const temporaryDatabaseFile = path.join(temporaryProjectDirectory, 'test-db.sqlite');
    const temporaryDestinationPath = path.join(temporaryProjectDirectory, 'backup-destination');
    const missingBackupFilePath = path.join(temporaryProjectDirectory, 'missing-backup.sqlite');

    try {
      fs.writeFileSync(temporaryDatabaseFile, 'fake database data');
      fs.mkdirSync(temporaryDestinationPath, { recursive: true });

      const result = runRestoreScript(
        ['--file', missingBackupFilePath],
        {
          DATABASE_PATH: temporaryDatabaseFile,
          BACKUP_DESTINATION_PATH: temporaryDestinationPath,
        },
        {
          currentWorkingDirectory: temporaryProjectDirectory,
        }
      );

      expect(result.exitCode).not.toBe(0);

      const logsDirectoryPath = path.join(temporaryProjectDirectory, 'logs');
      expect(fs.existsSync(logsDirectoryPath)).toBe(true);

      const restoreFailureLogFiles = fs
        .readdirSync(logsDirectoryPath)
        .filter((filename) =>
          /^restore-failure-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.log$/.test(filename)
        );

      expect(restoreFailureLogFiles.length).toBeGreaterThan(0);

      const latestRestoreFailureLogFile = restoreFailureLogFiles.sort().at(-1)!;
      const latestRestoreFailureLogFilePath = path.join(
        logsDirectoryPath,
        latestRestoreFailureLogFile
      );
      const logFileContent = fs.readFileSync(latestRestoreFailureLogFilePath, 'utf-8');

      expect(logFileContent).toContain('Failure Reason: Backup file does not exist.');
      expect(logFileContent).toContain(path.basename(missingBackupFilePath));
    } finally {
      if (fs.existsSync(temporaryProjectDirectory)) {
        fs.rmSync(temporaryProjectDirectory, { recursive: true, force: true });
      }
    }
  });
});
