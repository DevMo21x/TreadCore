import React from 'react';
import type { Segment } from '@/types/preset';

export default function TimelineBar({
  timeline,
  total,
  page,
  setPage,
  perPage = 3,
}: {
  timeline: Array<Segment & { start: number; end: number }>;
  total: number;
  page: number;
  setPage: (p: number) => void;
  perPage?: number;
}) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  // color palette per segment position: cycle through three distinct palettes
  const palette = [
    'bg-gradient-to-r from-blue-400 to-blue-600',
    'bg-gradient-to-r from-green-400 to-green-600',
    'bg-gradient-to-r from-purple-400 to-purple-600',
  ];

  const colorFor = (index: number) => {
    return palette[index % palette.length] || palette[0];
  };

  const pageCount = timeline.length === 0 ? 0 : Math.ceil(timeline.length / perPage);
  const current = Math.min(Math.max(0, page), Math.max(0, pageCount - 1));
  const start = current * perPage;
  const slice = timeline.slice(start, start + perPage);
  const sliceTotal = slice.reduce((a, b) => a + (b.end - b.start), 0) || 1;

  return (
    <div className="w-full">
      <div className="w-full h-12 rounded-lg overflow-hidden bg-gray-100 flex items-stretch relative">
        {Array.from({ length: perPage }).map((_, i) => {
          const t = slice[i] ?? null;
          if (!t) {
            return (
              <div
                key={`slot-${current}-${i}`}
                style={{ flexBasis: `${100 / perPage}%`, flexGrow: 0, flexShrink: 0 }}
                className="relative flex items-center justify-center text-sm bg-gray-100"
              />
            );
          }

          const duration = t.end - t.start;
          const pct = sliceTotal ? (duration / sliceTotal) * 100 : 0;
          const color = colorFor(start + i);
          return (
            <div
              key={`slot-${current}-${i}`}
              style={{ flexBasis: `${pct}%`, flexGrow: pct, flexShrink: 0 }}
              className={`relative flex items-center justify-center text-white text-sm ${color}`}
            >
              <div className="px-3 truncate text-center">
                <div className="font-medium truncate">{t.name || `Segment ${start + i + 1}`}</div>
                <div className="text-xs opacity-90">{formatTime(duration)}</div>
              </div>
            </div>
          );
        })}

        {/* Pagination controls placed bottom-left and bottom-right */}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="text-lg font-medium text-gray-700">
          {pageCount > 0 ? `Page ${current + 1} of ${pageCount}` : 'Page 0 of 0'}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current <= 0}
            className="text-lg border border-[var(--hg-border-soft)] bg-[var(--hg-interactive-soft)] text-[var(--hg-text)] disabled:text-[var(--hg-disabled-text)] rounded px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--hg-interactive-muted)] transition-colors"
          >
            Prev
          </button>

          <button
            onClick={() => setPage(Math.min(current + 1, Math.max(0, pageCount - 1)))}
            disabled={current >= Math.max(0, pageCount - 1)}
            className="text-lg border border-[var(--hg-border-soft)] bg-[var(--hg-interactive-soft)] text-[var(--hg-text)] disabled:text-[var(--hg-disabled-text)] rounded px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--hg-interactive-muted)] transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
