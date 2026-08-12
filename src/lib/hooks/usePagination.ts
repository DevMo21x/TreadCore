'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type PaginationHistoryMode = 'push' | 'replace';

export type UsePaginationResult<T> = {
  pageSlice: T[];
  currentPage: number;
  pageCount: number;
  prev: () => void;
  next: () => void;
  goToPage: (n: number, options?: { history?: PaginationHistoryMode }) => void;
};

export default function usePagination<T>(
  items: T[],
  pageSize: number,
  paramKey = 'page'
): UsePaginationResult<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const raw = searchParams?.get(paramKey) ?? '1';
  let parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) parsed = 1;
  const currentPage = Math.min(Math.max(parsed, 1), pageCount);

  const start = (currentPage - 1) * pageSize;
  const pageSlice = items.slice(start, start + pageSize);

  const setPage = useCallback(
    (newPage: number, history: PaginationHistoryMode) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set(paramKey, String(newPage));
      const qs = params.toString();
      const url = `${pathname}${qs ? `?${qs}` : ''}`;

      if (history === 'push') {
        router.push(url, { scroll: false });
        return;
      }

      router.replace(url, { scroll: false });
    },
    [router, pathname, searchParams, paramKey]
  );

  const prev = useCallback(
    () => setPage(Math.max(1, currentPage - 1), 'push'),
    [setPage, currentPage]
  );
  const next = useCallback(
    () => setPage(Math.min(pageCount, currentPage + 1), 'push'),
    [setPage, currentPage, pageCount]
  );
  const goToPage = useCallback(
    (n: number, options?: { history?: PaginationHistoryMode }) => {
      const history = options?.history ?? 'replace';
      setPage(Math.min(Math.max(1, Math.floor(n)), pageCount), history);
    },
    [setPage, pageCount]
  );

  return { pageSlice, currentPage, pageCount, prev, next, goToPage };
}
