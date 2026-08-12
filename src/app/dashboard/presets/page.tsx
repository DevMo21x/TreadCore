import React, { Suspense } from 'react';
import PresetsList from '@/components/presets/PresetsList';
import { auth } from '@/auth';

export default async function PresetsPage() {
  const session = await auth();
  const currentUserRole = session?.user?.role ?? null;
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  return (
    <div className="h-full flex flex-col p-6">
      <h1 className="text-4xl font-bold mb-4">Preset Routines</h1>
      <p className="text-lg text-gray-600 mb-6">
        Browse curated presets, filter by difficulty or tag, and quick-start a routine.
      </p>
      <Suspense fallback={<div>Loading presets...</div>}>
        <PresetsList currentUserRole={currentUserRole} currentUserId={currentUserId} />
      </Suspense>
    </div>
  );
}
