# TreadCore: Smart Treadmill Frontend

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-yellow)

TreadCore is a modern, high-performance web application designed to serve as the frontend interface for smart treadmills. It features a stunning "hyper-grid" aesthetic, real-time data synchronization via MQTT, and comprehensive user and administrative capabilities.

## ✨ Features

- **Real-Time Telemetry:** Live synchronization with treadmill hardware using MQTT.
- **Hyper-Grid UI:** A futuristic, glassmorphism-inspired design system with smooth animations.
- **User Authentication:** Secure login and registration with role-based access control (NextAuth).
- **Interactive Dashboards:** Visualized workout data and performance metrics using Recharts.
- **Admin Control Panel:** Comprehensive user management and system monitoring.
- **Automated Backups:** Built-in SQLite database backup and restore scheduling.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Real-Time Data:** [MQTT](https://mqtt.org/)
- **Testing:** [Vitest](https://vitest.dev/) & Testing Library

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v10.0.0` or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd treadmill-frontend-v2
   ```

2. **Install dependencies**
   *Note: This project strictly uses `pnpm`.*
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to include your database paths, NextAuth secrets, and MQTT broker details.*

4. **Initialize the Database**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 💾 Database Management & Backups

This project uses an SQLite database with built-in backup automation.

### Available Database Commands
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run migrations against the database
- `pnpm db:studio` - Open Drizzle Studio to inspect data
- `pnpm db:restore` - Run the interactive database restore tool

### Automated Backups
Configure the following in your `.env.local` to enable scheduled backups:
```env
BACKUP_DESTINATION_PATH=/path/to/backups
BACKUP_CRON_SCHEDULE="0 2 * * *" # e.g., 2:00 AM daily
BACKUP_RETENTION_DAYS=30
```
For full details, see the [Backup and Restore Guide](docs/backup-and-restore-guide.md).

---

## 🧪 Testing

We use Vitest for fast and reliable testing.
- `pnpm test` - Run tests in watch mode
- `pnpm test:ui` - Run tests with the Vitest UI
- `pnpm test:coverage` - Run tests with coverage reports

---

## 📚 Documentation

Detailed documentation can be found in the `docs/` directory:
- [Git Workflow & Branching](docs/git-workflow.md)
- [Styling Approach (Tailwind v4)](docs/styling.md)
- [API Routes](docs/api-routes.md)
- [State Management](docs/state-management.md)

---

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to understand our team workflow, branching conventions, and commit message formats (enforced via Husky & Commitlint).

## 📄 License

This project is intended for educational purposes as part of a web development curriculum.
