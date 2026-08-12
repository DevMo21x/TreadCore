'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import usePagination from '@/lib/hooks/usePagination';
import WorkoutHistoryTable from '@/components/WorkoutHistoryTable';
import { getWorkoutHistory } from '@/lib/actions/workout';
import { useWorkoutStore } from '@/stores';
import type { WorkoutSummary } from '@/types';

interface Props {
  initialHistory: WorkoutSummary[];
  userId: number;
}

const PAGE_SIZE = 10;

export default function WorkoutDashboard({ initialHistory, userId }: Props) {
  const [history, setHistory] = useState<WorkoutSummary[]>(initialHistory);

  const lastFinalizedAt = useWorkoutStore((s) => s.lastFinalizedAt);
  const { pageSlice, currentPage, pageCount, prev, next, goToPage } = usePagination(
    history,
    PAGE_SIZE
  );
  const refreshHistory = useEffectEvent(() => {
    getWorkoutHistory(userId)
      .then((data) => {
        setHistory(data);
        goToPage(1);
      })
      .catch(console.error);
  });

  // Re-fetch history whenever a workout is finalized
  useEffect(() => {
    if (lastFinalizedAt === null) return;

    refreshHistory();
  }, [lastFinalizedAt]);

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col gap-6">
      <WorkoutHistoryTable
        pageSlice={pageSlice}
        currentPage={currentPage}
        pageCount={pageCount}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}
