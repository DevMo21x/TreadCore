'use client';

import { useErrorStore } from '@/stores';
import { ToastShell } from './ui/ToastShell';

function ErrorToast({ id, title, message }: { id: string; title: string; message: string }) {
  const dismiss = useErrorStore((state) => state.dismiss);

  const baseClassName =
    'glass-panel pointer-events-auto w-full max-w-md rounded-2xl border border-red-500/40 bg-[rgb(42_9_9/0.96)] px-5 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-all duration-300 ease-out';

  return (
    <ToastShell
      id={id}
      autoDismissMs={7000}
      ariaLive="assertive"
      className={baseClassName}
      onDismiss={() => dismiss(id)}
    >
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-400">Error</p>
        <p className="text-sm font-semibold text-(--hg-text)">{title}</p>
        <p className="text-xs leading-4 text-(--hg-muted)">{message}</p>
      </div>
    </ToastShell>
  );
}

export function ErrorOverlay() {
  const queue = useErrorStore((state) => state.queue);
  const activeError = queue[0];

  if (!activeError) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-center p-4 pt-6">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <ErrorToast
          key={activeError.id}
          id={activeError.id}
          title={activeError.title}
          message={activeError.message}
        />
      </div>
    </div>
  );
}

export default ErrorOverlay;
