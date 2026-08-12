import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Activity } from 'react-activity-calendar';
import { WorkoutHeatmapCalendar } from '@/components/profile/WorkoutHeatmapCalendar';

// Capture properties passed into the calendar so the tests can inspect the data
const activityCalendarMock = vi.hoisted(() => vi.fn());

vi.mock('react-activity-calendar', () => ({
  ActivityCalendar: (props: {
    data: Activity[];
    theme?: { light?: string[] };
    labels?: { totalCount?: string };
  }) => {
    activityCalendarMock(props);
    return <div data-testid="activity-calendar" />;
  },
}));

// Pull the most recent data array that the calendar received
function getRenderedActivities(): Activity[] {
  const calls = activityCalendarMock.mock.calls;
  const lastCall = calls.length > 0 ? calls[calls.length - 1] : undefined;
  const props = lastCall?.[0] as { data: Activity[] } | undefined;
  return props?.data ?? [];
}

function getLastCalendarProps(): {
  data: Activity[];
  theme?: { light?: string[] };
  labels?: { totalCount?: string };
} {
  const calls = activityCalendarMock.mock.calls;
  const lastCall = calls.length > 0 ? calls[calls.length - 1] : undefined;
  return (
    (lastCall?.[0] as {
      data: Activity[];
      theme?: { light?: string[] };
      labels?: { totalCount?: string };
    }) ?? { data: [] }
  );
}

describe('WorkoutHeatmapCalendar', () => {
  beforeEach(() => {
    // Fix the system date so the boundary end date is predictable in every run
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
    activityCalendarMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('adds boundary entries and sorts the activity list', () => {
    render(
      <WorkoutHeatmapCalendar
        startDate="2026-01-05"
        endDate="2026-05-01"
        workoutDistances={[
          { date: '2026-04-10', distanceKm: 6.0 },
          { date: '2026-01-05', distanceKm: 1.5 },
        ]}
      />
    );

    const activities = getRenderedActivities();
    const dates = activities.map((entry) => entry.date);

    expect(dates).toEqual(['2026-01-05', '2026-04-10', '2026-05-01']);
    expect(activities).toContainEqual({ date: '2026-05-01', count: 0, level: 0 });
    expect(activities).toContainEqual({ date: '2026-01-05', count: 1.5, level: 1 });
    expect(activities).toContainEqual({ date: '2026-04-10', count: 6.0, level: 3 });
  });

  it('filters out entries that fall outside the selected date range', () => {
    render(
      <WorkoutHeatmapCalendar
        startDate="2026-02-10"
        endDate="2026-05-01"
        workoutDistances={[
          { date: '2025-12-31', distanceKm: 4.0 },
          { date: '2026-02-10', distanceKm: 2.5 },
          { date: '2027-01-01', distanceKm: 1.0 },
        ]}
      />
    );

    const dates = getRenderedActivities().map((entry) => entry.date);

    expect(dates).toEqual(['2026-02-10', '2026-05-01']);
  });

  it('keeps visual config for empty-day color and total count label', () => {
    render(
      <WorkoutHeatmapCalendar startDate="2026-01-05" endDate="2026-05-01" workoutDistances={[]} />
    );

    const props = getLastCalendarProps();

    expect(props.theme?.light?.[0]).toBe('#6b7280');
    expect(props.labels?.totalCount).toBe('0 km traveled in the past year');
  });

  it('starts exactly at the provided first session date with no pre-week padding', () => {
    render(
      <WorkoutHeatmapCalendar startDate="2026-01-07" endDate="2026-05-01" workoutDistances={[]} />
    );

    const dates = getRenderedActivities().map((entry) => entry.date);

    expect(dates[0]).toBe('2026-01-07');
    expect(dates).not.toContain('2026-01-06');
  });
});
