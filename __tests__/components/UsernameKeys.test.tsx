import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UsernameKeys } from '@/components/keyboard/UsernameKeys';

describe('UsernameKeys', () => {
  it('renders the angle-bracket keys and emits them when pressed', async () => {
    const user = userEvent.setup();
    const onKey = vi.fn();

    render(<UsernameKeys onKey={onKey} />);

    await user.click(screen.getByRole('button', { name: '<' }));
    expect(onKey).toHaveBeenCalledWith('<');

    await user.click(screen.getByRole('button', { name: '>' }));
    expect(onKey).toHaveBeenCalledWith('>');

    expect(screen.queryByRole('button', { name: '?' })).not.toBeInTheDocument();
  });
});
