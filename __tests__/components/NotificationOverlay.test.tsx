import { createElement, type ComponentPropsWithoutRef } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationOverlay } from '@/components/NotificationOverlay';
import { useNotificationStore } from '@/stores';

vi.mock('next/image', () => ({
  default: (props: ComponentPropsWithoutRef<'img'>) =>
    createElement('img', { ...props, alt: props.alt ?? '' }),
}));

describe('NotificationOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    act(() => {
      useNotificationStore.getState().clear();
    });
  });

  afterEach(() => {
    cleanup();

    act(() => {
      vi.runOnlyPendingTimers();
      useNotificationStore.getState().clear();
    });

    vi.useRealTimers();
  });

  it('renders nothing when the queue is empty', () => {
    const { container } = render(<NotificationOverlay />);

    expect(container.innerHTML).toBe('');
  });

  it('renders xp notifications and auto-dismisses them after 3 seconds', () => {
    act(() => {
      useNotificationStore.getState().push({
        type: 'xp',
        message: 'Workout complete. +120 XP',
      });
    });

    render(<NotificationOverlay />);

    const toast = screen.getByText('Workout complete. +120 XP').closest('article');

    expect(toast).toHaveClass('opacity-0');
    expect(toast).toHaveClass('glass-panel');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText('Workout complete. +120 XP').closest('article')).toHaveClass(
      'opacity-100'
    );

    act(() => {
      vi.advanceTimersByTime(2740);
    });

    expect(screen.getByText('Workout complete. +120 XP').closest('article')).toHaveClass(
      'opacity-0'
    );

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByText('Workout complete. +120 XP')).not.toBeInTheDocument();
    expect(useNotificationStore.getState().queue).toEqual([]);
  });

  it('renders queued notifications sequentially instead of stacking them', () => {
    act(() => {
      useNotificationStore.getState().push({
        type: 'badge',
        name: 'First Mile',
        description: 'Completed your first mile.',
        imagePath: null,
      });
      useNotificationStore.getState().push({
        type: 'badge',
        name: 'Night Runner',
        description: 'Completed a workout after dark.',
        imagePath: '/badges/night-runner.svg',
      });
    });

    render(<NotificationOverlay />);

    expect(screen.getByText('First Mile')).toBeInTheDocument();
    expect(screen.queryByText('Night Runner')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText('First Mile').closest('article')).toHaveClass('opacity-100');

    act(() => {
      vi.advanceTimersByTime(2990);
    });

    expect(screen.queryByText('First Mile')).not.toBeInTheDocument();
    expect(screen.getByText('Night Runner').closest('article')).toHaveClass('opacity-0');
    expect(screen.getByRole('img', { name: 'Night Runner badge art' })).toHaveAttribute(
      'src',
      '/badges/night-runner.svg'
    );

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText('Night Runner').closest('article')).toHaveClass('opacity-100');
  });

  it('renders badge notifications with image art when imagePath is present', () => {
    act(() => {
      useNotificationStore.getState().push({
        type: 'badge',
        name: 'First Mile',
        description: 'Completed your first mile.',
        imagePath: '/badges/first-mile.svg',
      });
    });

    render(<NotificationOverlay />);

    expect(screen.getByRole('img', { name: 'First Mile badge art' })).toHaveAttribute(
      'src',
      '/badges/first-mile.svg'
    );
    expect(screen.getByText('First Mile')).toBeInTheDocument();
    expect(screen.getByText('Completed your first mile.')).toBeInTheDocument();
  });

  it('renders badge notifications with fallback art when imagePath is null', () => {
    act(() => {
      useNotificationStore.getState().push({
        type: 'badge',
        name: 'First Mile',
        description: 'Completed your first mile.',
        imagePath: null,
      });
    });

    render(<NotificationOverlay />);

    expect(screen.getByText('Badge Unlocked')).toBeInTheDocument();
    expect(screen.getByText('First Mile')).toBeInTheDocument();
    expect(screen.getByText('Completed your first mile.')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
  });

  it('cleans up dismiss timers when the overlay unmounts', () => {
    act(() => {
      useNotificationStore.getState().push({
        type: 'xp',
        message: 'Workout complete. +120 XP',
      });
    });

    const dismissSpy = vi.spyOn(useNotificationStore.getState(), 'dismiss');
    const { unmount } = render(<NotificationOverlay />);

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(dismissSpy).not.toHaveBeenCalled();
  });
});
