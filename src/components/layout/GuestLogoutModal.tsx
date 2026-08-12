'use client';

type GuestLogoutModalProps = Readonly<{
  isOpen: boolean;
  isDiscarding: boolean;
  error: string;
  onSignup: () => void;
  onDiscard: () => Promise<void>;
  onClose: () => void;
}>;

export function GuestLogoutModal({
  isOpen,
  isDiscarding,
  error,
  onSignup,
  onDiscard,
  onClose,
}: GuestLogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-logout-title"
        className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
              Guest Session
            </p>
            <h2 id="guest-logout-title" className="mt-2 text-2xl font-semibold text-slate-900">
              Save this progress before you leave?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDiscarding}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Create an account to keep the workouts and achievement progress from this guest session.
          If you discard it instead, the guest profile and its saved progress will be deleted.
        </p>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSignup}
            disabled={isDiscarding}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              void onDiscard();
            }}
            disabled={isDiscarding}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDiscarding ? 'Discarding Guest Session...' : 'Discard Guest Session'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isDiscarding}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
