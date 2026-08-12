'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardEntry, LeaderboardSort } from '@/lib/actions/leaderboard';
import usePagination from '@/lib/hooks/usePagination';
import PaginationBar from './ui/PaginationBar';

interface Props {
  sortBy: LeaderboardSort;
  title: string;
  paramKey: string;
}

const STAT_LABELS: Record<LeaderboardSort, string> = {
  xp: 'XP',
  distance: 'Distance (km)',
  calories: 'Calories',
  elevation: 'Elevation (m)',
  duration: 'Duration',
};

function formatStatValue(sortBy: LeaderboardSort, entry: LeaderboardEntry): string {
  switch (sortBy) {
    case 'xp':
      return entry.totalXp.toLocaleString();
    case 'distance':
      return entry.totalDistanceKm.toFixed(2);
    case 'calories':
      return entry.totalCalories.toLocaleString();
    case 'elevation':
      return entry.totalElevationGain.toFixed(1);
    case 'duration': {
      const totalMin = Math.floor(entry.totalDurationSeconds / 60);
      const hours = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
  }
}

interface FetchState {
  loading: boolean;
  error: string | null;
  entries: LeaderboardEntry[];
}

export default function LeaderboardTable({ sortBy, title, paramKey }: Props) {
  const [{ loading, error, entries }, setFetchState] = useState<FetchState>({
    loading: true,
    error: null,
    entries: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/leaderboard?sortBy=${sortBy}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load leaderboard');
        return res.json() as Promise<LeaderboardEntry[]>;
      })
      .then((data) => setFetchState({ loading: false, error: null, entries: data }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setFetchState({
          loading: false,
          error: 'Could not load leaderboard. Please try again.',
          entries: [],
        });
      });

    return () => controller.abort();
  }, [sortBy]);

  // Row-level pagination
  const PAGE_SIZE = 9;
  const { pageSlice, currentPage, pageCount, prev, next } = usePagination(
    entries,
    PAGE_SIZE,
    paramKey
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] shadow-lg backdrop-blur-sm">
      <div className="border-b border-[color:var(--hg-border-soft)] px-6 py-4">
        <h2 className="text-lg font-bold text-[var(--hg-text)]">{title}</h2>
        <p className="text-xs text-[var(--hg-muted)] mt-0.5">Lifetime {STAT_LABELS[sortBy]}</p>
      </div>

      {loading && (
        <div className="px-6 py-8 text-center text-sm text-[var(--hg-muted)]">Loading...</div>
      )}

      {error && (
        <div className="px-6 py-8 text-center text-sm text-[var(--hg-tertiary)]">{error}</div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-[var(--hg-muted)]">
          No completed workouts yet.
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--hg-interactive-soft)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--hg-muted)]">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">{STAT_LABELS[sortBy]}</th>
                  <th className="px-4 py-3">Workouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--hg-border-soft)]">
                {pageSlice.map((entry) => (
                  <tr
                    key={entry.userId}
                    className="transition-colors hover:bg-[color:var(--hg-interactive-soft)]"
                  >
                    <td className="px-4 py-3 font-mono text-[var(--hg-muted)]">
                      {entry.rank === 1
                        ? '🥇'
                        : entry.rank === 2
                          ? '🥈'
                          : entry.rank === 3
                            ? '🥉'
                            : `#${entry.rank}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--hg-text)]">
                      {entry.username}
                    </td>
                    <td className="px-4 py-3 text-[var(--hg-text)]">
                      {formatStatValue(sortBy, entry)}
                    </td>
                    <td className="px-4 py-3 text-[var(--hg-muted)]">{entry.workoutCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Row-level PaginationBar, only if more than PAGE_SIZE entries */}
          {entries.length > PAGE_SIZE && (
            <PaginationBar
              currentPage={currentPage}
              pageCount={pageCount}
              onPrev={prev}
              onNext={next}
            />
          )}
        </>
      )}
    </div>
  );
}
