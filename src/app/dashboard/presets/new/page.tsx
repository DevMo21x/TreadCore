import React from 'react';
import PresetForm from '@/components/presets/PresetForm';
import { auth } from '@/auth';

type Props = { searchParams?: Promise<Record<string, string | string[]>> };

export default async function Page({ searchParams }: Props) {
  const session = await auth();
  const currentUserRole = session?.user?.role ?? null;
  const params = searchParams ? await searchParams : undefined;
  const visibilityParam = params?.visibility;
  const visibilityRequested = Boolean(visibilityParam && String(visibilityParam) === 'public');
  const defaultVisibility =
    visibilityRequested && currentUserRole === 'admin' ? 'public' : 'private';
  const lockVisibility = visibilityRequested && currentUserRole === 'admin';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Preset</h1>
      <p className="text-sm text-gray-600 mb-6">
        Build a preset with segments and preview the timeline.
      </p>
      {/* PresetForm is a client component */}
      <PresetForm
        defaultVisibility={defaultVisibility}
        currentUserRole={currentUserRole}
        lockVisibility={lockVisibility}
        edit={false}
      />
    </div>
  );
}
