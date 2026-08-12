'use client';
import React, { useEffect, useState } from 'react';
import usePagination from '@/lib/hooks/usePagination';
import PaginationBar from '@/components/ui/PaginationBar';
import Link from 'next/link';
import PresetCard from './PresetCard';
import type { Preset } from '@/types/preset';

interface Props {
  currentUserRole: string | null;
  currentUserId?: number | null;
}

export default function PresetsList({ currentUserRole, currentUserId }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    let mountedPresets = true;
    fetch('/api/presets')
      .then((r) => r.json())
      .then((data) => {
        if (mountedPresets) setPresets(data || []);
      })
      .catch(() => {
        if (mountedPresets) setPresets([]);
      })
      .finally(() => {
        if (mountedPresets) setLoading(false);
      });
    return () => {
      mountedPresets = false;
    };
  }, []);

  const filtered = presets.filter((p) => {
    if (difficulty && p.difficulty !== difficulty) return false;
    return true;
  });

  const PAGE_SIZE = 12;
  const { pageSlice, currentPage, pageCount, prev, next, goToPage } = usePagination<Preset>(
    filtered,
    PAGE_SIZE
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={isAdmin ? '/dashboard/presets/new?public=1' : '/dashboard/presets/new'}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          New Preset
        </Link>
        {isAdmin ? (
          <Link
            href={'/dashboard/presets/new?visibility=public'}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            New Public Preset
          </Link>
        ) : null}

        <div className="ml-4">
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              goToPage(1);
            }}
            className="border px-3 py-2 rounded"
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      {/* difficulty filter moved inline with New Preset buttons above */}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageSlice.map((p) => (
                <PresetCard
                  key={p.id}
                  preset={p}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              ))}
            </div>
          </div>

          <PaginationBar
            currentPage={currentPage}
            pageCount={pageCount}
            onPrev={prev}
            onNext={next}
          />
        </div>
      )}
    </div>
  );
}
