import Link from 'next/link';
import { ContactAdminReveal } from '@/components/auth/ContactAdminReveal';
import { GuestSignInButton } from '@/components/auth/GuestSignInButton';
import { UserSelectionPanel } from '@/components/UserSelectionPanel';

export default function HomePage() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim() ?? '';

  return (
    <div className="hyper-grid-theme relative min-h-screen overflow-hidden font-hyper-grid text-(--hg-text)">
      <div aria-hidden="true" className="hyper-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-430 items-center px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <section className="glass-panel relative overflow-hidden rounded-4xl border-white/15 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.36)] sm:px-8 sm:py-10 lg:min-h-190 lg:px-10 lg:py-12">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--hg-secondary) to-transparent opacity-80"
            />
            <div
              aria-hidden="true"
              className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(125,60,255,0.28)_0%,transparent_68%)]"
            />
            <div
              aria-hidden="true"
              className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,227,253,0.18)_0%,transparent_72%)]"
            />

            <div className="relative flex h-full flex-col justify-center gap-12">
              <div className="mx-auto w-full max-w-xl space-y-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-bold tracking-[0.34em] text-(--hg-secondary)">
                    HYPERGRID ACCESS
                  </p>
                  <div>
                    <p className="text-3xl font-bold tracking-[-0.04em] text-(--hg-primary) sm:text-4xl lg:text-5xl">
                      TREAD_CORE
                    </p>
                    <p className="mt-2 text-xs font-bold tracking-[0.28em] text-(--hg-muted) sm:text-sm">
                      Precision Performance
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xl space-y-5">
                <div className="grid gap-4">
                  <GuestSignInButton />

                  <div className="grid gap-4">
                    <Link
                      href="/login"
                      className="group relative flex min-h-28 w-full items-center justify-between overflow-hidden rounded-[28px] border border-[rgba(189,244,255,0.35)] bg-[linear-gradient(135deg,rgba(0,227,253,0.2),rgba(19,19,19,0.86))] px-7 py-6 text-left shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-150 active:translate-y-px active:border-[rgba(189,244,255,0.6)] active:shadow-[0_10px_24px_rgba(0,227,253,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-secondary)"
                    >
                      <span>
                        <span className="block text-[11px] font-bold tracking-[0.26em] text-(--hg-secondary)">
                          RETURNING USER
                        </span>
                        <span className="mt-3 block text-2xl font-semibold tracking-[-0.03em] text-(--hg-text)">
                          Login
                        </span>
                      </span>
                      <span className="text-3xl text-(--hg-secondary) transition-transform duration-150 group-active:translate-x-1">
                        →
                      </span>
                    </Link>

                    <Link
                      href="/signup"
                      className="group relative flex min-h-28 w-full items-center justify-between overflow-hidden rounded-[28px] border border-[rgba(208,188,255,0.38)] bg-[linear-gradient(135deg,rgba(125,60,255,0.28),rgba(19,19,19,0.86))] px-7 py-6 text-left shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-150 active:translate-y-px active:border-[rgba(208,188,255,0.62)] active:shadow-[0_10px_24px_rgba(125,60,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-primary)"
                    >
                      <span>
                        <span className="block text-[11px] font-bold tracking-[0.26em] text-(--hg-primary)">
                          NEW ACCOUNT
                        </span>
                        <span className="mt-3 block text-2xl font-semibold tracking-[-0.03em] text-(--hg-text)">
                          Sign Up
                        </span>
                      </span>
                      <span className="text-3xl text-(--hg-primary) transition-transform duration-150 group-active:translate-x-1">
                        →
                      </span>
                    </Link>
                  </div>
                </div>

                <ContactAdminReveal adminEmail={adminEmail} />
              </div>
            </div>
          </section>

          <UserSelectionPanel mode="quick-login" className="w-full min-w-0 self-stretch" />
        </div>
      </div>
    </div>
  );
}
