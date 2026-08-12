import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import usePagination from '@/lib/hooks/usePagination';

type NavigationOptions = { scroll: boolean };

const mockPush = vi.fn((url: string, _options?: NavigationOptions) => url);
const mockReplace = vi.fn((url: string, _options?: NavigationOptions) => url);

let searchParamsValue = 'page=2&query=tempo';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard/workout-history',
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

function getLastNavigationCall(mockFn: typeof mockPush) {
  const [url, options] = (mockFn.mock.calls.at(-1) ?? []) as [string, NavigationOptions?];

  return {
    url: new URL(String(url), 'http://localhost'),
    options,
  };
}

function PaginationHarness() {
  const items = Array.from({ length: 25 }, (_, index) => index + 1);
  const { pageSlice, currentPage, pageCount, prev, next, goToPage } = usePagination(items, 10);

  return (
    <div>
      <div>{`Page ${currentPage} of ${pageCount}`}</div>
      <div>{pageSlice.join(',')}</div>
      <button type="button" onClick={prev}>
        Prev
      </button>
      <button type="button" onClick={next}>
        Next
      </button>
      <button type="button" onClick={() => goToPage(1)}>
        Reset
      </button>
    </div>
  );
}

describe('usePagination', () => {
  beforeEach(() => {
    searchParamsValue = 'page=2&query=tempo';
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reads the current page from search params and slices the current page items', () => {
    render(<PaginationHarness />);

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('11,12,13,14,15,16,17,18,19,20')).toBeInTheDocument();
  });

  it('uses push navigation for next and preserves other query params', () => {
    render(<PaginationHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();

    const { url, options } = getLastNavigationCall(mockPush);

    expect(url.pathname).toBe('/dashboard/workout-history');
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('query')).toBe('tempo');
    expect(options).toEqual({ scroll: false });
  });

  it('uses replace navigation for goToPage resets', () => {
    render(<PaginationHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();

    const { url, options } = getLastNavigationCall(mockReplace);

    expect(url.pathname).toBe('/dashboard/workout-history');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('query')).toBe('tempo');
    expect(options).toEqual({ scroll: false });
  });
});
