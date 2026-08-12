import { vi } from 'vitest';

export function makeSelectChain<Row>(rows: Row[]) {
  const end = Promise.resolve(rows);
  const chain = {
    from: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
    then: (resolve: (value: Row[]) => unknown) => end.then(resolve),
    catch: (reject: (error: unknown) => unknown) => end.catch(reject),
    finally: (callback: () => void) => end.finally(callback),
  };

  chain.from.mockImplementation(() => chain);
  chain.limit.mockImplementation(() => chain);
  chain.offset.mockImplementation(() => chain);
  chain.orderBy.mockImplementation(() => chain);
  chain.where.mockImplementation(() => chain);

  return chain;
}

export function makeUpdateChain<Row>(rows: Row[]) {
  const end = Promise.resolve(rows);
  const chain = {
    returning: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
  };

  chain.set.mockImplementation(() => chain);
  chain.where.mockImplementation(() => chain);
  chain.returning.mockImplementation(() => end);

  return chain;
}

export function makeDeleteChain<Row>(rows: Row[]) {
  const end = Promise.resolve(rows);
  const chain = {
    returning: vi.fn(),
    where: vi.fn(),
  };

  chain.where.mockImplementation(() => chain);
  chain.returning.mockImplementation(() => end);

  return chain;
}
