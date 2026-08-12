import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PaginationBar from '@/components/ui/PaginationBar';

describe('PaginationBar', () => {
  it('renders with both buttons disabled when pageCount === 1', () => {
    render(<PaginationBar currentPage={1} pageCount={1} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('does not render when pageCount === 0', () => {
    const { container } = render(
      <PaginationBar currentPage={0} pageCount={0} onPrev={vi.fn()} onNext={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders navigation buttons when pageCount > 1', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(<PaginationBar currentPage={2} pageCount={3} onPrev={onPrev} onNext={onNext} />);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('disables Prev button when on page 1', () => {
    render(<PaginationBar currentPage={1} pageCount={5} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('disables Next button when on last page', () => {
    render(<PaginationBar currentPage={5} pageCount={5} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Prev' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
