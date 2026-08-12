import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VideosPage from '../../../src/app/dashboard/videos/page';

// Mock next/navigation useRouter for Vitest
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Scenic Routes VideosPage', () => {
  beforeEach(() => {
    // Mock fetch for categories
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, name: 'Mountains', thumbnailPath: '/img/mountains.jpg' },
            { id: 2, name: 'Coast', thumbnailPath: '/img/coast.jpg' },
          ]),
      })
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with correct classes', () => {
    render(<VideosPage />);
    expect(screen.getByText(/loading regions/i)).toBeInTheDocument();
    const loadingDiv = screen.getByText(/loading regions/i).parentElement;
    expect(loadingDiv).toHaveClass('bg-[var(--hg-surface-soft)]');
    expect(loadingDiv).toHaveClass('min-h-[60vh]');
  });

  it('renders eyebrow, heading, subtitle, and cards with correct classes', async () => {
    render(<VideosPage />);
    await waitFor(() => expect(screen.getByText('SCENIC ROUTES')).toBeInTheDocument());
    expect(screen.getByText('SCENIC ROUTES')).toHaveClass(
      'text-[11px]',
      'font-bold',
      'tracking-[0.34em]',
      'text-[var(--hg-secondary)]'
    );
    expect(screen.getByRole('heading', { name: 'Scenic Routes' })).toHaveClass(
      'text-3xl',
      'font-bold',
      'tracking-[-0.04em]',
      'text-[var(--hg-text)]'
    );
    expect(screen.getByText('Choose a region to explore')).toHaveClass('text-[var(--hg-muted)]');
    // Check card
    const card = screen.getByText('Mountains').closest('button');
    expect(card).toHaveClass(
      'glass-panel',
      'rounded-xl',
      'border',
      'border-[color:var(--hg-border-soft)]'
    );
    expect(card).toHaveClass('hover:border-[color:var(--hg-secondary)]/40');
    expect(screen.getByText('Mountains')).toHaveClass(
      'text-[12px]',
      'font-bold',
      'tracking-widest',
      'text-[var(--hg-text)]'
    );
  });
});
