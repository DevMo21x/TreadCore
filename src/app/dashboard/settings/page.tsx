import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SettingsGrid } from '@/components/settings/SettingsGrid';
import { GUEST_ROLE } from '@/lib/auth/sessionUser';
import { findUserProfileById } from '@/lib/users/userService';

export default async function SettingsPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!session || Number.isNaN(userId)) {
    redirect('/login');
  }

  const profile = await findUserProfileById(userId);

  if (!profile) {
    notFound();
  }

  if (profile.role === GUEST_ROLE) {
    redirect('/dashboard/profile');
  }

  return (
    <div className="px-6 py-5 sm:px-8">
      <div className="mx-auto max-w-[1680px]">
        <h1 className="mb-5 text-4xl font-bold tracking-tight text-[var(--hg-text)]">Settings</h1>
        <SettingsGrid
          username={profile.username}
          weightKg={profile.weightKg}
          ageYears={profile.ageYears}
        />
      </div>
    </div>
  );
}
