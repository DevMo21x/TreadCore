'use client';
import LeaderboardTable from '@/components/LeaderboardTable';
import PaginationBar from '@/components/ui/PaginationBar';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { LeaderboardSort } from '@/lib/actions/leaderboard';

interface Category {
  sortBy: LeaderboardSort;
  title: string;
  paramKey: string;
}

const CATEGORY_PAGES: Category[][] = [
  [
    { sortBy: 'xp', title: 'XP', paramKey: 'xp_page' },
    { sortBy: 'distance', title: 'Distance', paramKey: 'distance_page' },
  ],
  [
    { sortBy: 'calories', title: 'Calories', paramKey: 'calories_page' },
    { sortBy: 'elevation', title: 'Elevation', paramKey: 'elevation_page' },
  ],
  [{ sortBy: 'duration', title: 'Duration', paramKey: 'duration_page' }],
];

const CAT_PAGE_COUNT = CATEGORY_PAGES.length;

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const catPageRaw = searchParams?.get('cat_page') ?? '1';
  let catPage = parseInt(catPageRaw, 10);
  if (Number.isNaN(catPage)) catPage = 1;
  catPage = Math.min(Math.max(catPage, 1), CAT_PAGE_COUNT);

  const handleCatPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('cat_page', String(newPage));
    router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`, { scroll: false });
  };

  const currentCategories = useMemo(() => CATEGORY_PAGES[catPage - 1], [catPage]);

  // For cat_page 3, center or half-width the single table
  const isSingleTable = currentCategories.length === 1;

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-[var(--hg-text)]">Leaderboards</h1>
        <p className="text-sm text-[var(--hg-muted)] mt-1">
          Lifetime stats ranked across all users
        </p>
      </div>

      <PaginationBar
        currentPage={catPage}
        pageCount={CAT_PAGE_COUNT}
        onPrev={() => handleCatPageChange(Math.max(1, catPage - 1))}
        onNext={() => handleCatPageChange(Math.min(CAT_PAGE_COUNT, catPage + 1))}
      />

      <div
        className={
          isSingleTable
            ? 'flex-1 min-h-0 flex justify-center items-start'
            : 'flex-1 min-h-0 grid gap-6 grid-cols-1 xl:grid-cols-2'
        }
      >
        {currentCategories.map((cat) => (
          <div key={cat.sortBy} className={isSingleTable ? 'w-full xl:max-w-[50%]' : ''}>
            <LeaderboardTable sortBy={cat.sortBy} title={cat.title} paramKey={cat.paramKey} />
          </div>
        ))}
      </div>
    </div>
  );
}
