'use client';

import { useMemo } from 'react';
import { ActivityCalendar, type Activity } from 'react-activity-calendar';
import type { WorkoutDateDistance } from '@/db/queries/workouts';

type WorkoutHeatmapCalendarProps = {
  workoutDistances: WorkoutDateDistance[];
  startDate: string;
  endDate: string;
};

// Maps a total distance (km) for a single day to an activity level between zero and four.
// Level zero means no activity (used for boundary or empty entries).
// Levels one through four represent increasing distance intensity (moderate thresholds).
// These thresholds are largely arbitrary, but loosely based on expected average distances ran per day on a treadmill.
function toActivityLevel(distanceKm: number): 0 | 1 | 2 | 3 | 4 {
  if (distanceKm <= 0) return 0;
  if (distanceKm <= 2) return 1;
  if (distanceKm <= 5) return 2;
  if (distanceKm <= 10) return 3;
  return 4;
}

export function WorkoutHeatmapCalendar({
  workoutDistances,
  startDate,
  endDate,
}: WorkoutHeatmapCalendarProps) {
  const filteredDistances = useMemo(
    () => workoutDistances.filter((row) => row.date >= startDate && row.date <= endDate),
    [workoutDistances, startDate, endDate]
  );

  const totalKm = useMemo(
    () => Math.round(filteredDistances.reduce((sum, row) => sum + row.distanceKm, 0) * 10) / 10,
    [filteredDistances]
  );

  // Memoise the transformed data so the calendar does not recalculate it on every render
  const data = useMemo<Activity[]>(() => {
    // The "react-activity-calendar" component requires the data array
    // to span explicitly from the first to the last date of the range.
    // Boundaries are supplied by the parent so the grid can start on the
    // user's first workout date and end on today.

    const boundaryStart: Activity = {
      date: startDate,
      count: 0,
      level: 0,
    };
    const boundaryEnd: Activity = {
      date: endDate,
      count: 0,
      level: 0,
    };

    // Convert the database rows into "Activity" objects and keep only
    // the entries that fall inside the target year range
    const activities: Activity[] = filteredDistances.map((row) => ({
      date: row.date,
      count: row.distanceKm,
      level: toActivityLevel(row.distanceKm),
    }));

    // Merge the boundary entries with the real data.
    // Boundaries must not duplicate an existing real date
    // so we only add them when that date is missing from the dataset
    const existingDates = new Set(activities.map((activity) => activity.date));
    const result: Activity[] = [];
    if (!existingDates.has(startDate)) {
      result.push(boundaryStart);
    }
    result.push(...activities);
    if (!existingDates.has(endDate)) {
      result.push(boundaryEnd);
    }

    // Ensure the final list is in ascending date order
    // because the calendar library requires chronological input
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [endDate, startDate, filteredDistances]);

  return (
    <ActivityCalendar
      data={data}
      colorScheme="light"
      theme={{
        light: ['#6b7280', '#6ee7b7', '#34d399', '#10b981', '#059669'],
      }}
      labels={{
        totalCount: `${totalKm} km traveled in the past year`,
        legend: { less: 'Less', more: 'More' },
      }}
      showWeekdayLabels
      tooltips={{
        activity: {
          text: (activity) =>
            activity.count === 0
              ? 'No activity'
              : `${activity.count.toFixed(1)} km on ${activity.date}`,
          withArrow: true,
        },
      }}
      blockSize={13}
      blockRadius={2}
      blockMargin={4}
      fontSize={13}
    />
  );
}
