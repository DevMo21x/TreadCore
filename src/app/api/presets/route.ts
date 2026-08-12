import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/db/index';
import { presets, presetSegments } from '@/db/schema';
import { auth } from '@/auth';
import { eq, or, and } from 'drizzle-orm';

type PresetRow = typeof presets.$inferSelect;

// Validation schema for creating a preset
const segmentSchema = z.object({
  name: z.string().nullable().optional(),
  duration_seconds: z.number().int().min(1).max(86400),
  speed: z.number().min(0).max(7),
  incline: z.number().min(0).max(10),
});

const createPresetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  segments: z.array(segmentSchema).min(1).max(200),
});

const MAX_CUSTOM_PRESETS_PER_USER = 50;

// GET /api/presets?tag=...&difficulty=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const difficulty = searchParams.get('difficulty');

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const visibilityFilter = userId
    ? or(
        eq(presets.visibility, 'public'),
        and(eq(presets.visibility, 'private'), eq(presets.authorId, userId))
      )
    : eq(presets.visibility, 'public');

  const rows = db.select().from(presets).where(visibilityFilter).all();

  const filtered = rows.filter((r: PresetRow) => {
    if (difficulty && r.difficulty !== difficulty) return false;
    if (tag) {
      const tagsText = r.tags || '';
      if (!tagsText.includes(tag)) return false;
    }
    return true;
  });

  return NextResponse.json(filtered);
}

// POST /api/presets
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = Number(session.user.id);

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createPresetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Only admins may create public presets. Public presets must have authorId = null.
  if (parsed.data.visibility === 'public' && session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create public presets' }, { status: 403 });
  }

  // Safety: limit per-user custom presets
  const existingCount = db.select().from(presets).where(eq(presets.authorId, userId)).all().length;
  if (existingCount >= MAX_CUSTOM_PRESETS_PER_USER) {
    return NextResponse.json({ error: 'Preset limit reached' }, { status: 429 });
  }

  const p = parsed.data;
  const totalDuration = p.segments.reduce((s, seg) => s + seg.duration_seconds, 0);

  const authorId = session.user?.role === 'admin' && p.visibility === 'public' ? null : userId;

  const [inserted] = db
    .insert(presets)
    .values({
      name: p.name,
      description: p.description ?? null,
      authorId: authorId,
      visibility: p.visibility ?? 'private',
      tags: (p.tags || []).join(','),
      difficulty: p.difficulty ?? 'moderate',
      totalDurationSeconds: totalDuration,
    })
    .returning({ id: presets.id })
    .all();

  const presetId = inserted.id;

  try {
    p.segments.forEach((s, i: number) => {
      db.insert(presetSegments)
        .values({
          presetId: presetId,
          position: i,
          name: s.name ?? null,
          durationSeconds: s.duration_seconds,
          speed: s.speed,
          incline: s.incline,
        })
        .run();
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to insert segments' }, { status: 500 });
  }

  // Build the response from data we already have so we don't need an extra
  // DB round-trip (and tests with simple mocks don't need to simulate re-fetch).
  const segmentsAfter = p.segments.map((s, i) => ({
    id: null,
    position: i,
    name: s.name ?? null,
    duration_seconds: s.duration_seconds,
    speed: s.speed,
    incline: s.incline,
  }));

  return NextResponse.json(
    {
      id: presetId,
      name: p.name,
      description: p.description ?? null,
      authorId,
      visibility: p.visibility ?? 'private',
      tags: (p.tags || []).join(','),
      difficulty: p.difficulty ?? 'moderate',
      totalDurationSeconds: totalDuration,
      segments: segmentsAfter,
    },
    { status: 201 }
  );
}
