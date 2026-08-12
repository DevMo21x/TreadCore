import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/app/admin/AdminSignOutButton', () => ({
  AdminSignOutButton: () => <button>Sign Out</button>,
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...props
  }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...arguments_: unknown[]) => {
    mockRedirect(...arguments_);
    throw new Error('NEXT_REDIRECT');
  },
}));

import { auth } from '@/auth';
import AdminLayout from '@/app/admin/layout';

const mockedAuth = vi.mocked(auth);

describe('AdminLayout', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockRedirect.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to the login page', async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(AdminLayout({ children: <div /> })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects non-admin users back to the dashboard', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '1', role: 'guest', username: 'member' } } as any);

    await expect(AdminLayout({ children: <div /> })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders the admin shell for admin users', async () => {
    mockedAuth.mockResolvedValue({ user: { id: '1', role: 'admin', username: 'operator' } } as any);

    const layout = await AdminLayout({ children: <div>Admin shell content</div> });
    render(layout);

    const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^Dashboard/i })).toHaveAttribute(
      'href',
      '/admin'
    );
    expect(within(nav).getByRole('link', { name: /Videos/i })).toHaveAttribute(
      'href',
      '/admin/videos'
    );
    expect(within(nav).getByRole('link', { name: /Users/i })).toHaveAttribute(
      'href',
      '/admin/users'
    );
    expect(within(nav).getByRole('link', { name: /Backups/i })).toHaveAttribute(
      'href',
      '/admin/backups'
    );
    expect(within(nav).getByRole('link', { name: /Back to Dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    expect(screen.getByText('Admin shell content')).toBeInTheDocument();
    expect(screen.getByText('SIGNED IN AS operator')).toBeInTheDocument();
  });
});
