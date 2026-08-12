import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/components/auth/GuestSignInButton', () => ({
  GuestSignInButton: () => <div data-testid="guest-signin-button">Guest CTA</div>,
}));

vi.mock('@/components/auth/ContactAdminReveal', () => ({
  ContactAdminReveal: ({ adminEmail }: { adminEmail: string }) => (
    <div data-testid="contact-admin-reveal">{adminEmail}</div>
  ),
}));

vi.mock('@/components/UserSelectionPanel', () => ({
  UserSelectionPanel: ({ mode, className }: { mode: string; className?: string }) => (
    <div data-testid="user-selection-panel" data-mode={mode} data-class-name={className}>
      Quick Login Panel
    </div>
  ),
}));

import HomePage from '@/app/page';

describe('HomePage', () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    process.env.ADMIN_EMAIL = '  admin@example.com  ';
  });

  afterEach(() => {
    process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  it('renders the HyperGrid landing shell with branded actions and quick login', () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector('.hyper-grid-theme')).toBeInTheDocument();
    expect(container.querySelector('.hyper-grid-overlay')).toBeInTheDocument();
    expect(screen.getByText('TREAD_CORE')).toBeInTheDocument();
    expect(screen.getByText('Precision Performance')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    expect(screen.getByTestId('guest-signin-button')).toBeInTheDocument();
    expect(screen.getByTestId('contact-admin-reveal')).toHaveTextContent('admin@example.com');
    expect(screen.getByTestId('user-selection-panel')).toHaveAttribute('data-mode', 'quick-login');
    expect(screen.getByTestId('user-selection-panel')).toHaveAttribute(
      'data-class-name',
      'w-full min-w-0 self-stretch'
    );
  });
});
