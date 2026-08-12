import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PresetCard from '@/components/presets/PresetCard';
import { useErrorStore } from '@/stores';

const mockPush = vi.fn();
const startPresetById = vi.fn();

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/hooks/usePresetRunner', () => ({
  usePresetRunner: () => ({
    startPresetById,
  }),
}));

describe('PresetCard', () => {
  beforeEach(() => {
    mockPush.mockReset();
    startPresetById.mockReset();
    useErrorStore.getState().clear();
    localStorage.clear();
  });

  it('pushes quick start error toast when starting the preset fails', async () => {
    startPresetById.mockRejectedValueOnce(new Error('Runner unavailable'));

    render(
      <PresetCard
        preset={{
          id: 7,
          name: 'Intervals',
          difficulty: 'moderate',
          totalDurationSeconds: 300,
          segments: [],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /quick start/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(startPresetById).toHaveBeenCalledWith(7));

    await waitFor(() => {
      expect(
        useErrorStore
          .getState()
          .queue.some(
            (entry) =>
              entry.title === 'Quick Start Failed' && entry.message === 'Failed to start preset.'
          )
      ).toBe(true);
    });
  });
});
