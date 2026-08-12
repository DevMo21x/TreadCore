import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ContactAdminReveal } from '@/components/auth/ContactAdminReveal';

describe('ContactAdminReveal', () => {
  it('keeps the admin email hidden until the user asks for help', async () => {
    const user = userEvent.setup();

    render(<ContactAdminReveal adminEmail="admin@example.com" />);

    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Forgot PIN? Contact Admin' }));

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('shows a configuration fallback when no admin email is available', async () => {
    const user = userEvent.setup();

    render(<ContactAdminReveal adminEmail="" />);

    await user.click(screen.getByRole('button', { name: 'Forgot PIN? Contact Admin' }));

    expect(
      screen.getByText(
        'Admin contact email is not configured on this treadmill yet. Ask staff for help.'
      )
    ).toBeInTheDocument();
  });

  it('lets the user collapse the revealed contact panel again', async () => {
    const user = userEvent.setup();

    render(<ContactAdminReveal adminEmail="admin@example.com" />);

    await user.click(screen.getByRole('button', { name: 'Forgot PIN? Contact Admin' }));
    await user.click(screen.getByRole('button', { name: 'Hide Admin Contact' }));

    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
  });
});
