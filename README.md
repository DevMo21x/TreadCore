# Smart Treadmill

> **A Next.js SaaS Starter Template for Web Development Teams**

This repository is a starter template for your team project. It provides a fully configured development environment, project structure, and comprehensive documentation to get your team building immediately.

**👉 Start here: [CONTRIBUTING.md](CONTRIBUTING.md)** — Review the contribution guidelines and team workflow before getting started.

## Prerequisites

| Tool    | Version  | Check Command    |
| ------- | -------- | ---------------- |
| Node.js | ≥ 20.0.0 | `node --version` |
| pnpm    | ≥ 9.0.0  | `pnpm --version` |
| Git     | Latest   | `git --version`  |

## Getting Started

```bash
# 1. Clone the repository
git clone [your-repo-url]
cd [your-repo-name]

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
│   ├── (admin)/            # Admin route group (protected — you implement)
│   ├── (auth)/             # Auth pages: login, signup (you implement logic)
│   ├── (dashboard)/        # Dashboard route group
│   ├── (marketing)/        # Public pages: landing, pricing, about, contact
│   ├── api/                # API routes (Route Handlers)
│   ├── layout.tsx          # Root layout with Navbar and Footer
│   ├── globals.css         # Global styles and Tailwind configuration
│   ├── error.tsx           # Global error boundary
│   ├── loading.tsx         # Global loading state
│   └── not-found.tsx       # 404 page
├── components/             # Reusable React components
│   ├── layout/             # Navbar, Footer
│   └── ui/                 # UI components (add shadcn/ui or your own)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and shared logic
├── types/                  # TypeScript type definitions
├── public/                 # Static assets (images, fonts, etc.)
├── docs/                   # Project documentation (21 guides)
├── __tests__/              # Test files
├── .github/                # GitHub workflows, PR template, issue templates
├── .devcontainer/          # Dev Container configuration
└── [config files]          # TypeScript, ESLint, Prettier, Vitest, etc.
```

## Available Scripts

| Script               | Command                 | Description                     |
| -------------------- | ----------------------- | ------------------------------- |
| `pnpm dev`           | `next dev --turbopack`  | Start dev server with Turbopack |
| `pnpm build`         | `next build`            | Create production build         |
| `pnpm start`         | `next start`            | Start production server         |
| `pnpm lint`          | `next lint`             | Run ESLint                      |
| `pnpm lint:fix`      | `next lint --fix`       | Run ESLint and auto-fix issues  |
| `pnpm format`        | `prettier --write .`    | Format all files with Prettier  |
| `pnpm format:check`  | `prettier --check .`    | Check formatting (used in CI)   |
| `pnpm type-check`    | `tsc --noEmit`          | Check TypeScript types          |
| `pnpm test`          | `vitest`                | Run tests in watch mode         |
| `pnpm test:ui`       | `vitest --ui`           | Run tests with browser UI       |
| `pnpm test:coverage` | `vitest run --coverage` | Run tests with coverage report  |
| `pnpm db:restore`    | `tsx scripts/restore.ts` | Restore database from backup file |

## Tech Stack

| Technology      | Purpose           | Why It's Here                             |
| --------------- | ----------------- | ----------------------------------------- |
| Next.js 16      | React framework   | App Router, Server Components, API routes |
| React 19        | UI library        | Component-based UI development            |
| TypeScript      | Type safety       | Catch errors before runtime               |
| Tailwind CSS 4  | Styling           | Utility-first CSS, fast to iterate        |
| ESLint          | Code linting      | Consistent code quality                   |
| Prettier        | Code formatting   | Consistent code style                     |
| Husky           | Git hooks         | Automated checks on commit                |
| Commitlint      | Commit messages   | Enforced conventional commit format       |
| Vitest          | Testing           | Fast, modern test runner                  |
| Testing Library | Component testing | Test components like users use them       |

## Documentation Index

| Document                                                   | Description                                       |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md)                         | Team contribution workflow                        |
| [docs/typescript.md](docs/typescript.md)                   | TypeScript overview and configuration             |
| [docs/styling.md](docs/styling.md)                         | Tailwind CSS v4 and styling approach              |
| [docs/code-quality.md](docs/code-quality.md)               | ESLint, Prettier, Husky, conventional commits     |
| [docs/git-workflow.md](docs/git-workflow.md)               | Feature branching and git workflow                |
| [docs/branch-protection.md](docs/branch-protection.md)     | Branch protection rules and configuration         |
| [docs/contributing-guide.md](docs/contributing-guide.md)   | Detailed contribution guidelines                  |
| [docs/agile-process.md](docs/agile-process.md)             | Sprint structure and Agile workflow               |
| [docs/testing.md](docs/testing.md)                         | Testing with Vitest and Testing Library           |
| [docs/api-routes.md](docs/api-routes.md)                   | API Route Handlers guide                          |
| [docs/state-management.md](docs/state-management.md)       | State management options and patterns             |
| [docs/performance.md](docs/performance.md)                 | Performance optimization guide                    |
| [docs/accessibility.md](docs/accessibility.md)             | Web accessibility (a11y) guide                    |
| [docs/deployment-guide.md](docs/deployment-guide.md)       | Deploying to Vercel and other platforms           |
| [docs/ci-cd-requirements.md](docs/ci-cd-requirements.md)   | CI/CD pipeline explanation                        |
| [docs/devcontainer.md](docs/devcontainer.md)               | Dev Container setup guide                         |
| [docs/ai-usage-policy.md](docs/ai-usage-policy.md)         | AI tool policy and team agreement                 |
| [docs/ai-features.md](docs/ai-features.md)                 | Implementing AI features (OpenRouter + Vercel AI) |
| [docs/payments.md](docs/payments.md)                       | Payment integration guide (Stripe)                |
| [docs/admin-guide.md](docs/admin-guide.md)                 | Admin dashboard and RBAC guide                    |
| [docs/backup-and-restore-guide.md](docs/backup-and-restore-guide.md) | Complete backup and restore guide for administrators and developers |
| [docs/component-libraries.md](docs/component-libraries.md) | UI component library comparison                   |
| [docs/enhancements.md](docs/enhancements.md)               | Stretch goals quick reference                     |

## Database Backup and Restore

This project includes a full backup and restore workflow to reduce data loss risk:

- Automatic scheduled backups.
- Manual backups from the administrator backups page.
- Restore from the administrator backups page and from the terminal.
- A pre-restore safety snapshot before each restore.

For complete operational and developer details, read [docs/backup-and-restore-guide.md](docs/backup-and-restore-guide.md).

### Environment Variables

| Variable | Required for automatic scheduler | Description | Example |
| --- | --- | --- | --- |
| `DATABASE_PATH` | No | Path to the SQLite database file. Defaults to `sqlite.db`. | `./data/app.db` |
| `BACKUP_DESTINATION_PATH` | Yes | Path to the mounted Universal Serial Bus backup folder. | `/media/usb/backups` |
| `BACKUP_CRON_SCHEDULE` | Yes | Cron expression defining backup frequency. | `0 2 * * *` (2:00 daily) |
| `BACKUP_RETENTION_DAYS` | Yes | Number of days to keep automatic backup files. | `30` |
| `BACKUP_LOGS_PATH` | No | Optional directory path. When set, the application writes failure log files directly to this directory. | `/var/log/smart-treadmill/backups` |

The automatic scheduler activates only when `BACKUP_DESTINATION_PATH`, `BACKUP_CRON_SCHEDULE`, and `BACKUP_RETENTION_DAYS` are valid. If any of these values are missing or invalid, the application logs a warning and continues running without scheduled backups.

### Backup and Restore Flow

1. On server startup, `src/instrumentation.ts` registers backup scheduling after migrations and media scanning complete.
2. At each `BACKUP_CRON_SCHEDULE` time, the system opens the database in read-only mode and writes `backup-<timestamp>.sqlite`.
3. After a successful automatic backup, retention cleanup deletes expired `backup-*.sqlite` files older than `BACKUP_RETENTION_DAYS`.
4. From `/admin/backups`, an administrator can create a manual backup (`manual-backup-<timestamp>.sqlite`).
5. From `/admin/backups`, an administrator can restore a selected backup file. The system always creates `pre-restore-<timestamp>.sqlite` first.
6. Backup events are logged as structured JavaScript Object Notation with a `[Backup]` prefix.

### Restore from Terminal

Use `db:restore` to overwrite the current database with a selected backup file:

```bash
pnpm db:restore -- --file /media/usb/backups/backup-2026-05-07T02-00-00Z.sqlite
```

During this flow, the script validates paths, creates a pre-restore safety snapshot, asks for explicit `CONFIRM`, and then copies the selected backup over the active database file.

Important note: after a restore, restart the application process if write requests were active during the operation.

### Troubleshooting

| Symptom | Cause | Solution |
| --- | --- | --- |
| Backup scheduling skipped warning at startup | One or more required scheduler variables are missing or invalid | Set `BACKUP_DESTINATION_PATH`, `BACKUP_CRON_SCHEDULE`, and `BACKUP_RETENTION_DAYS` in `.env.local` |
| Backup destination path does not exist or is not writable | Universal Serial Bus device is not mounted or path is incorrect | Verify mount status and confirm `BACKUP_DESTINATION_PATH` points to a writable directory |
| BACKUP_CRON_SCHEDULE is not a valid cron expression | Cron syntax is incorrect | Use a standard five-field cron expression, for example `0 2 * * *` |
| Source database file does not exist or is not readable | `DATABASE_PATH` points to a missing or unreadable file | Verify database path and file permissions |
| Restore fails after confirmation | Source or destination file permission issue | Check file permissions. The safety snapshot is preserved for recovery |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for team workflow, branching conventions, and commit message format.

## License

This project is for educational purposes as part of a college-level web development course.
