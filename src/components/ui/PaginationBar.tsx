'use client';

type Props = {
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
};

// NOTE: PaginationBar height (px-4 py-3) equals 48px and is load-bearing for PAGE_SIZE calculations across the epic.
// Changing padding/height requires updating PAGE_SIZE values everywhere.
export default function PaginationBar({ currentPage, pageCount, onPrev, onNext }: Props) {
  if (pageCount === 0) return null;

  return (
    <div className="text-(--hg-text) border-t border-(--hg-border-soft) bg-(--hg-surface-panel) px-4 py-3 flex items-center justify-between">
      <div className="text-sm font-medium">
        Page {currentPage} of {pageCount}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="text-(--hg-text) bg-(--hg-interactive-soft) text-sm font-medium border border-(--hg-border-soft) rounded px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= pageCount}
          className="text-(--hg-text) bg-(--hg-interactive-soft) text-sm font-medium border border-(--hg-border-soft) rounded px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
}
