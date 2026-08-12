import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AdminVideosPage from '@/app/admin/videos/page';

const mockFetch = vi.fn();

const sampleVideos = [
  {
    id: 10,
    filename: 'andes-run.mp4',
    title: 'Andes Run',
    categoryId: 1,
    categoryName: 'Andes',
    thumbnailPath: '/thumbs/andes.jpg',
    videoPath: '/videos/andes-run.mp4',
    isVisible: true,
    createdAt: '2026-05-19',
  },
];

const sampleCategories = [
  {
    id: 1,
    name: 'Andes',
    thumbnailPath: '/thumbs/andes.jpg',
  },
];

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminVideosPage', () => {
  it('shows a HyperGrid loading state without a hard-coded background', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminVideosPage />);

    const loadingText = screen.getByText('Loading admin panel…');
    expect(loadingText).toHaveClass('animate-pulse');
    expect(loadingText).toHaveClass('text-[var(--hg-muted)]');
    expect(loadingText.closest('div')).not.toHaveClass('bg-gray-950');
  });

  it('uses HyperGrid token classes for header and add video modal', async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/admin/videos') {
        return {
          ok: true,
          json: async () => sampleVideos,
        };
      }

      if (url === '/api/videos/categories') {
        return {
          ok: true,
          json: async () => sampleCategories,
        };
      }

      return {
        ok: false,
        json: async () => ({ error: 'Unhandled request in test.' }),
      };
    });

    const { container } = render(<AdminVideosPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Video Manager' })).toBeInTheDocument();
    });

    const pageRoot = container.firstElementChild;
    expect(pageRoot).not.toHaveClass('min-h-screen');
    expect(pageRoot).not.toHaveClass('bg-gray-950');

    const header = screen.getByRole('heading', { name: 'Video Manager' }).closest('header');
    expect(header).toHaveClass('border-[color:var(--hg-border-soft)]');
    expect(header).toHaveClass('backdrop-blur-md');

    const userSideLink = screen.getByRole('link', { name: /view user side/i });
    expect(userSideLink).toHaveClass('text-[color:var(--hg-secondary)]');

    const addVideoButton = screen.getByRole('button', { name: '+ Add Video' });
    expect(addVideoButton).toHaveClass('bg-[color:var(--hg-secondary)]');
    expect(addVideoButton).toHaveClass('text-black');

    await user.click(addVideoButton);

    const dialogTitle = screen.getByRole('heading', { name: 'Add New Video' });
    const dialogHeader = dialogTitle.closest('div');
    const dialogCard = dialogHeader?.parentElement;

    expect(dialogCard).not.toBeNull();
    if (!dialogCard) {
      return;
    }

    expect(dialogCard).toHaveClass('glass-panel');
    expect(dialogCard).toHaveClass('border-[color:var(--hg-border-soft)]');

    const dialogBackdrop = dialogCard.parentElement;
    expect(dialogBackdrop).toHaveClass('bg-black/60');
    expect(dialogBackdrop).toHaveClass('backdrop-blur-sm');

    const regionSelect = screen.getByLabelText('Region *');
    expect(regionSelect).toHaveClass('bg-[var(--hg-surface-soft)]');
    expect(regionSelect).toHaveClass('border-[color:var(--hg-border-soft)]');
  });
});
