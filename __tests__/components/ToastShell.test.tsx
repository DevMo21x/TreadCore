import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastShell } from '@/components/ui/ToastShell';

describe('ToastShell', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    vi.useRealTimers();
  });

  it('starts invisible and enters after 10ms', () => {
    render(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={vi.fn()}>
        <span>content</span>
      </ToastShell>
    );

    expect(screen.getByRole('status')).toHaveClass('opacity-0');

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByRole('status')).toHaveClass('opacity-100');
  });

  it('starts exit animation 250ms before autoDismissMs', () => {
    render(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={vi.fn()}>
        <span>content</span>
      </ToastShell>
    );

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByRole('status')).toHaveClass('opacity-100');

    act(() => {
      vi.advanceTimersByTime(2740); // total 2750ms = 3000 - 250
    });

    expect(screen.getByRole('status')).toHaveClass('opacity-0');
  });

  it('calls onDismiss after autoDismissMs', () => {
    const onDismiss = vi.fn();

    render(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={onDismiss}>
        <span>content</span>
      </ToastShell>
    );

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('respects a custom autoDismissMs value', () => {
    const onDismiss = vi.fn();

    render(
      <ToastShell id="test-1" autoDismissMs={7000} className="test-class" onDismiss={onDismiss}>
        <span>content</span>
      </ToastShell>
    );

    act(() => {
      vi.advanceTimersByTime(6750); // 7000 - 250
    });

    expect(screen.getByRole('status')).toHaveClass('opacity-0');
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('cleans up timers on unmount without calling onDismiss', () => {
    const onDismiss = vi.fn();

    const { unmount } = render(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={onDismiss}>
        <span>content</span>
      </ToastShell>
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('sets aria-live to polite by default', () => {
    render(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={vi.fn()}>
        <span>content</span>
      </ToastShell>
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('sets aria-live to assertive when specified', () => {
    render(
      <ToastShell
        id="test-1"
        autoDismissMs={3000}
        ariaLive="assertive"
        className="test-class"
        onDismiss={vi.fn()}
      >
        <span>content</span>
      </ToastShell>
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  });

  it('sets data-testid using the id prop', () => {
    render(
      <ToastShell id="abc-123" autoDismissMs={3000} className="test-class" onDismiss={vi.fn()}>
        <span>content</span>
      </ToastShell>
    );

    expect(screen.getByTestId('toast-abc-123')).toBeInTheDocument();
  });

  it('includes the passed className on the article element', () => {
    render(
      <ToastShell
        id="test-1"
        autoDismissMs={3000}
        className="glass-panel my-class"
        onDismiss={vi.fn()}
      >
        <span>content</span>
      </ToastShell>
    );

    expect(screen.getByRole('status')).toHaveClass('glass-panel', 'my-class');
  });

  it('does not reset timers when the parent re-renders with a new onDismiss reference', () => {
    const mockB = vi.fn();

    const { rerender } = render(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={vi.fn()}>
        <span>content</span>
      </ToastShell>
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Re-render with a new callback reference — simulates a parent re-render
    // with an inline arrow function. The ref pattern means the latest callback
    // is always called, so mockB (not the original) should fire.
    rerender(
      <ToastShell id="test-1" autoDismissMs={3000} className="test-class" onDismiss={mockB}>
        <span>content</span>
      </ToastShell>
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    }); // 3000ms total from mount

    // Timer fired at 3000ms from mount (not reset to 3000ms from rerender).
    // mockB is called because the ref always holds the latest onDismiss.
    expect(mockB).toHaveBeenCalledTimes(1);

    // Confirm the timer was not reset — if it had been, this would need
    // another 2000ms to fire and mockB would not yet have been called above.
  });
});
