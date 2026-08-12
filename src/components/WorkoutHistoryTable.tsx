'use client';

import PaginationBar from '@/components/ui/PaginationBar';
import type { WorkoutSummary } from '@/types';

interface Props {
  pageSlice: WorkoutSummary[];
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  // startTime from SQLite has no timezone suffix but is UTC; append Z so
  // JavaScript parses it as UTC instead of local time.
  const startMs = new Date(start.endsWith('Z') ? start : start + 'Z').getTime();
  const endMs = new Date(end).getTime();
  const diffMs = endMs - startMs;
  const totalSec = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkoutHistoryTable({
  pageSlice,
  currentPage,
  pageCount,
  onPrev,
  onNext,
}: Props) {
  if (pageSlice.length === 0) {
    return (
      <div className="rounded-lg border border-(--hg-border-soft) bg-(--hg-surface-panel) p-6 text-center text-sm text-(--hg-muted) shadow-lg backdrop-blur-sm">
        No workouts recorded yet.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-(--hg-border-soft) bg-(--hg-surface-panel) shadow-lg backdrop-blur-sm">
      <div className="shrink-0 border-b border-(--hg-border-soft) px-6 py-4">
        <h2 className="text-lg font-bold text-(--hg-text)">Workout History</h2>
      </div>
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--hg-interactive-soft) text-left text-xs font-semibold uppercase tracking-wide text-(--hg-muted)">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Avg Speed</th>
              <th className="px-4 py-3">Calories</th>
              <th className="px-4 py-3">Elevation</th>
              <th className="px-4 py-3">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--hg-border-soft)">
            {pageSlice.map((w) => (
              <tr key={w.workoutId} className="hover:bg-(--hg-interactive-soft)">
                <td className="px-4 py-3 font-mono text-(--hg-muted)">{w.workoutId}</td>
                <td className="px-4 py-3 text-(--hg-text)">{formatDate(w.startTime)}</td>
                <td className="px-4 py-3 font-mono text-(--hg-text)">
                  {formatDuration(w.startTime, w.endTime)}
                </td>
                <td className="px-4 py-3 text-(--hg-text)">
                  {w.totalDistanceKm.toFixed(2)}{' '}
                  <span className="text-(--hg-muted) text-xs">km</span>
                </td>
                <td className="px-4 py-3 text-(--hg-text)">
                  {w.avgSpeedKmh.toFixed(1)} <span className="text-(--hg-muted) text-xs">km/h</span>
                </td>
                <td className="px-4 py-3 text-(--hg-text)">
                  {w.totalCalories} <span className="text-(--hg-muted) text-xs">kcal</span>
                </td>
                <td className="px-4 py-3 text-(--hg-text)">
                  {w.totalElevationGain.toFixed(1)}{' '}
                  <span className="text-(--hg-muted) text-xs">m</span>
                </td>
                <td className="px-4 py-3 font-semibold text-(--hg-secondary)">{w.xpEarned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shrink-0">
        <PaginationBar
          currentPage={currentPage}
          pageCount={pageCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
