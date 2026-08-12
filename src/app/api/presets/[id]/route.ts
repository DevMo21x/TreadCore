import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/db/index';
import { presets, presetSegments } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';

type PresetRow = typeof presets.$inferSelect;
type SegmentRow = typeof presetSegments.$inferSelect;
type ValidatedSeg = z.infer<typeof segmentSchema> & { position?: number };

const updatePresetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
});

// Segment schema for validating segments provided in PATCH
const segmentSchema = z.object({
  name: z.string().nullable().optional(),
  duration_seconds: z.number().int().min(1).max(86400),
  speed: z.number().min(0).max(7),
  incline: z.number().min(0).max(15),
});

export async function GET(request: NextRequest) {
  // parse id from URL path
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const idStr = parts[parts.length - 1];
  const id = Number(idStr);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Only select the single preset row by its identifier using an indexed WHERE clause.
  // This avoids loading the entire presets table into memory and uses the database index.
  const [row] = db.select().from(presets).where(eq(presets.id, id)).all();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (row.visibility === 'private') {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;
    const isOwner = userId !== null && row.authorId === userId;
    const isAdmin = session?.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // load segments for this preset
  const segRows = db
    .select()
    .from(presetSegments)
    .where(eq(presetSegments.presetId, id))
    .orderBy(presetSegments.position)
    .all();
  const segments = (segRows || []).map((s: SegmentRow) => ({
    id: s.id,
    position: s.position,
    name: s.name,
    duration_seconds: s.durationSeconds,
    speed: s.speed,
    incline: s.incline,
  }));

  return NextResponse.json({ ...row, segments });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const userId = Number(session.user.id);
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = Number(parts[parts.length - 1]);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Select only the preset matching the requested identifier using an indexed WHERE clause.
  // This is more efficient than selecting all rows and then filtering in JavaScript.
  const [preset] = db.select().from(presets).where(eq(presets.id, id)).all();
  if (!preset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only owner or admin can modify
  // Only owner or admin can modify
  if (Number(preset.authorId) !== userId && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updatePresetSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );

  // Only admins may change a preset to public. Regular users (owners) cannot make a preset public.
  if (parsed.data.visibility === 'public' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can make presets public' }, { status: 403 });
  }

  // If segments provided, validate them against the segment schema
  if (Array.isArray(body.segments)) {
    const segParsed = z.array(segmentSchema).safeParse(body.segments);
    if (!segParsed.success) {
      return NextResponse.json(
        { error: 'Invalid segments', details: segParsed.error.flatten() },
        { status: 400 }
      );
    }
  }

  const updates: Partial<typeof presets.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.visibility !== undefined) updates.visibility = parsed.data.visibility;
  // If an admin changes visibility to public, clear authorId so it becomes a public preset
  if (
    parsed.data.visibility !== undefined &&
    parsed.data.visibility === 'public' &&
    session.user.role === 'admin'
  ) {
    updates.authorId = null;
  }
  if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags.join(',');
  if (parsed.data.difficulty !== undefined) updates.difficulty = parsed.data.difficulty;

  // If segments are provided, recalculate total duration and include in updates
  if (Array.isArray(body.segments)) {
    const total = (body.segments as ValidatedSeg[]).reduce(
      (sum: number, s: ValidatedSeg) => sum + Number(s.duration_seconds ?? 0),
      0
    );
    updates.totalDurationSeconds = total;
  }

  // apply preset updates
  if (Object.keys(updates).length > 0) {
    db.update(presets).set(updates).where(eq(presets.id, id)).run();
  }

  // handle segments if provided
  if (Array.isArray(body.segments)) {
    const segs = body.segments as ValidatedSeg[];
    // delete existing
    db.delete(presetSegments).where(eq(presetSegments.presetId, id)).run();
    // insert new segments in order
    for (const s of segs) {
      const pos = Number(s.position ?? 0);
      const name = s.name ?? null;
      const duration = Number(s.duration_seconds ?? 0);
      const speed = Number(s.speed ?? 0);
      const incline = Number(s.incline ?? 0);
      if (Number.isNaN(duration) || duration <= 0) continue;
      db.insert(presetSegments)
        .values({ presetId: id, position: pos, name, durationSeconds: duration, speed, incline })
        .run();
    }
  }

  // return the updated preset with segments (same shape as GET)
  // Re-query the updated preset directly by its identifier to obtain the latest values
  // and to avoid a full-table scan in application memory.
  const [rowAfter] = db.select().from(presets).where(eq(presets.id, id)).all();
  const segRowsAfter = db
    .select()
    .from(presetSegments)
    .where(eq(presetSegments.presetId, id))
    .orderBy(presetSegments.position)
    .all();
  const segmentsAfter = (segRowsAfter || []).map((s: SegmentRow) => ({
    id: s.id,
    position: s.position,
    name: s.name,
    duration_seconds: s.durationSeconds,
    speed: s.speed,
    incline: s.incline,
  }));

  return NextResponse.json({ ...rowAfter, segments: segmentsAfter });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.id)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const userId = Number(session.user.id);
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = Number(parts[parts.length - 1]);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  // Fetch only the preset to be deleted by matching its identifier; do not load the whole table.
  const [preset] = db.select().from(presets).where(eq(presets.id, id)).all();
  if (!preset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (Number(preset.authorId) !== userId && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  db.delete(presets).where(eq(presets.id, id)).run();

  return NextResponse.json({ ok: true });
}
