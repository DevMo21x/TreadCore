import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import WorkoutHistoryTable from '@/components/WorkoutHistoryTable';
import type { WorkoutSummary } from '@/types';

function buildWorkout(workoutId: number): WorkoutSummary {
  return {
    workoutId,
    startTime: '2024-01-01T10:00:00.000Z',
    endTime: '2024-01-01T10:30:00.000Z',
    totalDistanceKm: 5.25,
    avgSpeedKmh: 10.5,
    totalCalories: 325,
    totalElevationGain: 42.1,
    xpEarned: 75,
  };
}

describe('WorkoutHistoryTable', () => {
  it('renders the empty state without pagination controls when there are no workouts', () => {
    render(
      <WorkoutHistoryTable
        pageSlice={[]}
        currentPage={1}
        pageCount={1}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByText('No workouts recorded yet.')).toBeInTheDocument();
    expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
  });

  it('renders the provided page slice and pagination footer', () => {
    const pageSlice = Array.from({ length: 10 }, (_, index) => buildWorkout(4001 + index));

    render(
      <WorkoutHistoryTable
        pageSlice={pageSlice}
        currentPage={1}
        pageCount={2}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByText('Workout History')).toBeInTheDocument();
    expect(screen.getByText('4001')).toBeInTheDocument();
    expect(screen.getByText('4010')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });
});
