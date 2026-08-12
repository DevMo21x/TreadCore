import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

import AdminPage from '@/app/admin/page';

describe('AdminPage', () => {
  it('renders quick links for admin videos, users, and backups', async () => {
    const page = await AdminPage();
    render(page);

    expect(screen.getByRole('heading', { name: 'Choose an area to manage' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage videos/i })).toHaveAttribute(
      'href',
      '/admin/videos'
    );
    expect(screen.getByRole('link', { name: /Manage users/i })).toHaveAttribute(
      'href',
      '/admin/users'
    );
    expect(screen.getByRole('link', { name: /Manage backups/i })).toHaveAttribute(
      'href',
      '/admin/backups'
    );
  });
});
