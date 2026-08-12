import { create } from 'zustand';

export interface ToastStore<T extends { id: string }, TInput = Omit<T, 'id'>> {
  queue: T[];
  push: (input: TInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

function createToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createToastStore<T extends { id: string }, TInput = Omit<T, 'id'>>() {
  return create<ToastStore<T, TInput>>((set) => ({
    queue: [],
    push: (input: TInput) => {
      const id = createToastId();
      const item = { ...(input as object), id } as T;
      set((state) => ({ queue: [...state.queue, item] }));
      return id;
    },
    dismiss: (id) =>
      set((state) => ({
        queue: state.queue.filter((item) => item.id !== id),
      })),
    clear: () => set({ queue: [] }),
  }));
}
