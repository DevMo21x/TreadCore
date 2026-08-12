import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WorkoutDashboard from '@/components/WorkoutDashboard';
import { getWorkoutHistory } from '@/lib/actions/workout';
import { useWorkoutStore } from '@/stores';
import type { WorkoutSummary } from '@/types';

type NavigationOptions = { scroll: boolean };

const mockPush = vi.fn((url: string, _options?: NavigationOptions) => {
  searchParamsValue = new URL(url, 'http://localhost').searchParams.toString();
});
const mockReplace = vi.fn((url: string, _options?: NavigationOptions) => {
  searchParamsValue = new URL(url, 'http://localhost').searchParams.toString();
});

let searchParamsValue = 'page=2';

vi.mock('@/lib/actions/workout', () => ({
  getWorkoutHistory: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard/workout-history',
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

function buildHistory(count: number, startId = 1001): WorkoutSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    workoutId: startId + index,
    startTime: `2024-01-${String((index % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
    endTime: `2024-01-${String((index % 28) + 1).padStart(2, '0')}T10:30:00.000Z`,
    totalDistanceKm: 5 + index,
    avgSpeedKmh: 8 + index / 10,
    totalCalories: 250 + index,
    totalElevationGain: 12 + index,
    xpEarned: 50 + index,
  }));
}

describe('WorkoutDashboard', () => {
  const mockedGetWorkoutHistory = vi.mocked(getWorkoutHistory);

  beforeEach(() => {
    searchParamsValue = 'page=2';
    mockPush.mockClear();
    mockReplace.mockClear();
    mockedGetWorkoutHistory.mockReset();
    useWorkoutStore.setState({ lastFinalizedAt: null });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useWorkoutStore.setState({ lastFinalizedAt: null });
  });

  it('hydrates the current page from the URL and renders only that page slice', () => {
    render(<WorkoutDashboard initialHistory={buildHistory(12)} userId={7} />);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('1011')).toBeInTheDocument();
    expect(screen.getByText('1012')).toBeInTheDocument();
    expect(screen.queryByText('1001')).not.toBeInTheDocument();
  });

  it('re-fetches workout history and resets the view to page 1 after finalization', async () => {
    mockedGetWorkoutHistory.mockResolvedValue(buildHistory(13, 2001));

    render(<WorkoutDashboard initialHistory={buildHistory(12)} userId={7} />);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    act(() => {
      useWorkoutStore.getState().markFinalized();
    });

    await waitFor(() => expect(mockedGetWorkoutHistory).toHaveBeenCalledWith(7));
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Page 1 of 2')).toBeInTheDocument());
    expect(mockedGetWorkoutHistory).toHaveBeenCalledTimes(1);

    expect(screen.getByText('2001')).toBeInTheDocument();
    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.queryByText('2011')).not.toBeInTheDocument();

    const [url, options] = mockReplace.mock.calls.at(-1) ?? [];
    const nextUrl = new URL(String(url), 'http://localhost');

    expect(nextUrl.pathname).toBe('/dashboard/workout-history');
    expect(nextUrl.searchParams.get('page')).toBe('1');
    expect(options).toEqual({ scroll: false });
  });
});
