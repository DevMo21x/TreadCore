import React from 'react';
import PresetDetail from '@/components/presets/PresetDetail';
import { auth } from '@/auth';
import db from '@/db/index';
import { presets, presetSegments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

type PresetRow = InferSelectModel<typeof presets>;
type SegmentRow = InferSelectModel<typeof presetSegments>;

type ParamsShape = { id: string };
type Props = { params: Promise<ParamsShape> };

export default async function Page({ params }: Props) {
  const resolved = await params;
  const id = Number(resolved.id);

  const session = await auth();
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;
  const currentUserRole = session?.user?.role ?? null;

  // load preset server-side so ownership checks are available to the client
  const row: PresetRow | null = db.select().from(presets).where(eq(presets.id, id)).get() ?? null;

  if (!row) {
    return <div className="p-6">Preset not found</div>;
  }

  // if private, ensure current user may view
  if (row.visibility === 'private') {
    const isOwner = currentUserId != null && row.authorId === currentUserId;
    const isAdmin = currentUserRole === 'admin';
    if (!isOwner && !isAdmin) {
      return <div className="p-6">Forbidden</div>;
    }
  }

  // load segments
  const segRows: SegmentRow[] = db
    .select()
    .from(presetSegments)
    .where(eq(presetSegments.presetId, id))
    .orderBy(presetSegments.position)
    .all();
  const segments = (segRows || []).map((s) => ({
    id: s.id,
    position: s.position,
    name: s.name,
    duration_seconds: s.durationSeconds,
    speed: s.speed,
    incline: s.incline,
  }));

  const initialPreset = { ...row, segments };

  return (
    <div className="p-6">
      <PresetDetail
        id={id}
        initialPreset={initialPreset}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
