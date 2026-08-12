import Link from 'next/link';

type AdminCard = {
  href: string;
  title: string;
  description: string;
  label: string;
};

const ADMIN_CARDS: readonly AdminCard[] = [
  {
    href: '/admin/videos',
    title: 'Videos',
    description:
      'Upload, organize, and curate the training video library used throughout the treadmill experience.',
    label: 'Manage videos',
  },
  {
    href: '/admin/users',
    title: 'Users',
    description:
      'Review account access, supervise member activity, and keep administrative operations on track.',
    label: 'Manage users',
  },
  {
    href: '/admin/backups',
    title: 'Backups',
    description:
      'Create, restore, and manage system backups to ensure data integrity and recovery capabilities.',
    label: 'Manage backups',
  },
];

function AdminCardAccent({ title }: Readonly<{ title: string }>) {
  if (title === 'Videos') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m10 9 4 3-4 3Z" fill="currentColor" stroke="none" />
        <path d="m17 10 4-2v8l-4-2" />
      </svg>
    );
  }

  if (title === 'Backups') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        <path d="M17 15H7v-2h10v2z" />
        <path d="M17 11H7V9h10v2z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" />
    </svg>
  );
}

export default function AdminPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="glass-panel rounded-[28px] px-6 py-8 md:px-8">
        <p className="text-[11px] font-bold tracking-[0.28em] text-[color:var(--hg-secondary)]">
          ADMIN DASHBOARD
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[color:var(--hg-text)] md:text-4xl">
          Choose an area to manage
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--hg-muted)] md:text-base">
          Use the admin workspace to manage treadmill content and user operations without leaving
          the dashboard shell.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ADMIN_CARDS.map(({ href, title, description, label }) => (
          <Link
            key={href}
            href={href}
            className="glass-panel group rounded-[28px] px-6 py-6 transition-transform duration-200 hover:-translate-y-1 hover:border-[rgba(0,227,253,0.4)] md:px-8 md:py-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-2xl border border-white/10 bg-[rgba(0,227,253,0.12)] p-3 text-[var(--hg-secondary)]">
                <AdminCardAccent title={title} />
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 text-[var(--hg-muted)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--hg-secondary)]"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </div>

            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-[var(--hg-text)]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--hg-muted)] md:text-base">
              {description}
            </p>
            <span className="mt-6 inline-flex items-center text-[12px] font-bold tracking-[0.16em] text-[var(--hg-secondary)]">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
