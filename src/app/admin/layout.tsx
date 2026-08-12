import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { AdminSignOutButton } from './AdminSignOutButton';

type AdminNavIconName = 'dashboard' | 'videos' | 'users' | 'backups';

type AdminNavLink = {
  href: string;
  label: string;
  description: string;
  icon: AdminNavIconName;
};

const ADMIN_NAV_LINKS: readonly AdminNavLink[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    description: 'Overview and quick actions',
    icon: 'dashboard',
  },
  {
    href: '/admin/videos',
    label: 'Videos',
    description: 'Manage training content',
    icon: 'videos',
  },
  {
    href: '/admin/users',
    label: 'Users',
    description: 'Review user access',
    icon: 'users',
  },
  {
    href: '/admin/backups',
    label: 'Backups',
    description: 'Manage system backups',
    icon: 'backups',
  },
];

function AdminNavIcon({ icon }: Readonly<{ icon: AdminNavIconName }>) {
  switch (icon) {
    case 'dashboard':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 4h7v7H4z" />
          <path d="M13 4h7v4h-7z" />
          <path d="M13 10h7v10h-7z" />
          <path d="M4 13h7v7H4z" />
        </svg>
      );
    case 'videos':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="m10 9 4 3-4 3Z" fill="currentColor" stroke="none" />
          <path d="m17 10 4-2v8l-4-2" />
        </svg>
      );
    case 'users':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" />
        </svg>
      );
    case 'backups':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          <path d="M17 15H7v-2h10v2z" />
          <path d="M17 11H7V9h10v2z" />
        </svg>
      );
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== ADMIN_ROLE) {
    redirect('/dashboard');
  }

  return (
    <div className="hyper-grid-theme relative min-h-screen font-hyper-grid text-[var(--hg-text)]">
      <div aria-hidden="true" className="hyper-grid-overlay pointer-events-none fixed inset-0" />
      <div className="relative flex min-h-screen flex-col md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <nav
          aria-label="Admin navigation"
          className="flex w-full shrink-0 flex-col border-b border-white/15 bg-[rgba(32,31,31,0.4)] backdrop-blur-xl md:min-h-screen md:w-64 md:border-b-0 md:border-r"
        >
          <div className="p-6">
            <p className="text-[11px] font-bold tracking-[0.28em] text-[color:var(--hg-secondary)]">
              ADMIN ACCESS
            </p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.02em] text-[color:var(--hg-primary)]">
              TREAD_CORE
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--hg-muted)]">
              Operations and moderation tools.
            </p>
          </div>

          <div className="mt-6 flex flex-1 flex-col gap-2 px-2 pb-6">
            {ADMIN_NAV_LINKS.map(({ href, label, description, icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-4 rounded-r border-l-4 border-transparent px-4 py-4 text-left transition-all hover:border-[var(--hg-secondary)] hover:bg-[rgba(0,227,253,0.12)] hover:text-[var(--hg-text)]"
              >
                <span className="mt-1 text-[var(--hg-secondary)]">
                  <AdminNavIcon icon={icon} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[12px] font-bold tracking-[0.12em] text-[var(--hg-text)]">
                    {label}
                  </span>
                  <span className="text-xs leading-5 text-[var(--hg-muted)]">{description}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/15 px-2 py-6 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center justify-center rounded-md border border-white/10 bg-[rgba(19,19,19,0.6)] px-4 py-2 text-[12px] font-bold tracking-[0.12em] text-[var(--hg-muted)] transition hover:bg-white/5"
            >
              ← Back to Dashboard
            </Link>
            <AdminSignOutButton />
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/15 bg-[rgba(19,19,19,0.6)] px-4 py-6 backdrop-blur-md md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.24em] text-[color:var(--hg-secondary)]">
                  CONTROL CENTER
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--hg-muted)]">
                  Manage administrative tools, content workflows, and user-facing operations from a
                  single workspace.
                </p>
              </div>

              <div className="glass-panel inline-flex rounded-full px-4 py-2 text-[12px] font-bold tracking-[0.14em] text-[color:var(--hg-primary)]">
                {`SIGNED IN AS ${session.user.username}`}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
