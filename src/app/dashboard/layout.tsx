import { auth } from '@/auth';
import { InactiveSessionGuard } from '@/components/auth/InactiveSessionGuard';
import { CooldownOrchestrator } from '@/components/CooldownOrchestrator';
import { NotificationOverlay } from '@/components/NotificationOverlay';
import { ErrorOverlay } from '@/components/ErrorOverlay';
import { WorkoutOrchestrator } from '@/components/WorkoutOrchestrator';
import { DashboardBottomNav } from '@/components/layout/DashboardBottomNav';
import { DashboardPersistentBar } from '@/components/dashboard/DashboardPersistentBar';
import { PresetRunnerProviderWrapper } from '@/components/presets/PresetRunnerProviderWrapper';
import PresetRunnerPill from '@/components/presets/PresetRunnerPill';
import { GUEST_ROLE } from '@/lib/auth/sessionUser';
import { findUserProfileById } from '@/lib/users/userService';
import { THEME_MODE_DARK, THEME_MODE_LIGHT } from '@/lib/users/themeMode';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userId = Number(session.user.id);
  const callbackUrl = session.user.role === GUEST_ROLE ? '/' : '/login?reason=inactive';

  const isGuest = session.user.role === GUEST_ROLE;
  const profile = await findUserProfileById(userId);

  if (!profile) {
    redirect('/login');
  }

  const initialThemeMode =
    !isGuest && profile.themeMode === THEME_MODE_LIGHT ? THEME_MODE_LIGHT : THEME_MODE_DARK;

  return (
    <InactiveSessionGuard callbackUrl={callbackUrl}>
      <WorkoutOrchestrator userId={userId} />
      <CooldownOrchestrator />
      <PresetRunnerProviderWrapper>
        <div
          className={`hyper-grid-theme ${initialThemeMode === THEME_MODE_LIGHT ? 'light ' : ''}relative min-h-screen font-hyper-grid text-[var(--hg-text)]`}
        >
          <div
            aria-hidden="true"
            className="hyper-grid-overlay pointer-events-none fixed inset-0"
          />
          <div className="relative flex h-screen max-h-[1200px] w-full max-w-[1920px] mx-auto flex-col">
            {/* Preset runner pill — visible across all dashboard routes */}
            <div className="absolute right-6 top-4 z-30">
              <PresetRunnerPill />
            </div>
            <main className="relative flex-1 overflow-hidden">
              {children}
              <NotificationOverlay />
              <ErrorOverlay />
            </main>
            <div className="h-100 mb-2 flex shrink-0 flex-col gap-2 border-t border-[color:var(--hg-divider)] p-2">
              <DashboardBottomNav
                isGuest={isGuest}
                initialThemeMode={initialThemeMode}
                canPersistTheme={!isGuest}
              />
              <DashboardPersistentBar />
            </div>
          </div>
        </div>
      </PresetRunnerProviderWrapper>
    </InactiveSessionGuard>
  );
}
