import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorOverlay } from '@/components/ErrorOverlay';
import { useErrorStore } from '@/stores';

describe('ErrorOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    act(() => {
      useErrorStore.getState().clear();
    });
  });

  afterEach(() => {
    cleanup();

    act(() => {
      vi.runOnlyPendingTimers();
      useErrorStore.getState().clear();
    });

    vi.useRealTimers();
  });

  it('renders nothing when the error queue is empty', () => {
    const { container } = render(<ErrorOverlay />);

    expect(container.innerHTML).toBe('');
  });

  it('renders the error title and message', () => {
    act(() => {
      useErrorStore.getState().push({ title: 'Save Failed', message: 'Could not save preset.' });
    });

    render(<ErrorOverlay />);

    expect(screen.getByText('Save Failed')).toBeInTheDocument();
    expect(screen.getByText('Could not save preset.')).toBeInTheDocument();
  });

  it('auto-dismisses after 7000ms', () => {
    act(() => {
      useErrorStore.getState().push({ title: 'Error', message: 'Something went wrong.' });
    });

    render(<ErrorOverlay />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(useErrorStore.getState().queue).toEqual([]);
  });

  it('uses aria-live="assertive"', () => {
    act(() => {
      useErrorStore.getState().push({ title: 'Error', message: 'Something went wrong.' });
    });

    render(<ErrorOverlay />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  });

  it('starts exit animation 250ms before auto-dismiss', () => {
    act(() => {
      useErrorStore.getState().push({ title: 'Error', message: 'Something went wrong.' });
    });

    render(<ErrorOverlay />);

    act(() => {
      vi.advanceTimersByTime(10); // enter
    });

    expect(screen.getByRole('status')).toHaveClass('opacity-100');

    act(() => {
      vi.advanceTimersByTime(6740); // total 6750ms = 7000 - 250
    });

    expect(screen.getByRole('status')).toHaveClass('opacity-0');
  });

  it('renders errors sequentially from the queue', () => {
    act(() => {
      useErrorStore.getState().push({ title: 'First Error', message: 'First message.' });
      useErrorStore.getState().push({ title: 'Second Error', message: 'Second message.' });
    });

    render(<ErrorOverlay />);

    expect(screen.getByText('First Error')).toBeInTheDocument();
    expect(screen.queryByText('Second Error')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(screen.queryByText('First Error')).not.toBeInTheDocument();
    expect(screen.getByText('Second Error')).toBeInTheDocument();
  });
});
