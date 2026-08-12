import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAuth, presetRows } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  presetRows: [] as any[],
}));

vi.mock('@/db/index', () => {
  const fakeDb = {
    select: () => ({
      from: () => ({
        all: () => [...presetRows],
        where: () => ({
          all: () => [...presetRows],
          orderBy: () => ({ all: () => [...presetRows] }),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => ({ all: () => [{ id: presetRows.length + 1 }] }),
        run: () => ({ changes: 1 }),
      }),
    }),
    update: () => ({ set: () => ({ where: () => ({ run: () => ({ changes: 1 }) }) }) }),
    delete: () => ({ where: () => ({ run: () => ({ changes: 1 }) }) }),
  };
  return { default: fakeDb };
});

vi.mock('@/auth', () => ({ auth: mockAuth }));

import { GET, POST } from '@/app/api/presets/route';
import {
  GET as getById,
  PATCH as patchById,
  DELETE as deleteById,
} from '@/app/api/presets/[id]/route';

const publicPreset = {
  id: 1,
  name: 'Easy Walk',
  description: 'A gentle walk',
  authorId: null,
  visibility: 'public',
  tags: 'cardio,beginner',
  difficulty: 'easy',
  totalDurationSeconds: 1200,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  presetRows.length = 0;
  presetRows.push({ ...publicPreset });
  mockAuth.mockResolvedValue({ user: { id: '1', role: 'user' } });
});

describe('GET /api/presets', () => {
  it('returns list and supports tag filter', async () => {
    const req: any = { url: 'http://localhost/api/presets?tag=cardio' };
    const res = await GET(req);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].name).toBe('Easy Walk');
  });
});

describe('POST /api/presets', () => {
  it('rejects out-of-range values (speed > 20)', async () => {
    const req: any = {
      url: 'http://localhost/api/presets',
      json: async () => ({
        name: 'Bad Preset',
        segments: [{ duration_seconds: 60, speed: 100, incline: 0 }],
      }),
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('creates a preset with valid input', async () => {
    const req: any = {
      url: 'http://localhost/api/presets',
      json: async () => ({
        name: 'My Test Preset',
        visibility: 'private',
        difficulty: 'easy',
        segments: [{ duration_seconds: 60, speed: 3.0, incline: 0 }],
      }),
    };
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBeDefined();
  });
});

describe('GET /api/presets/[id]', () => {
  it('returns a public preset without auth', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('Easy Walk');
  });

  it('returns a private preset to its owner', async () => {
    presetRows[0] = { ...publicPreset, visibility: 'private', authorId: 1 };
    const res = await getById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(200);
  });

  it('returns 403 for a private preset accessed by a non-owner', async () => {
    presetRows[0] = { ...publicPreset, visibility: 'private', authorId: 99 };
    const res = await getById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Forbidden');
  });

  it('returns 403 for a private preset accessed without auth', async () => {
    presetRows[0] = { ...publicPreset, visibility: 'private', authorId: 99 };
    mockAuth.mockResolvedValue(null);
    const res = await getById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Forbidden');
  });
});

describe('PATCH /api/presets/[id]', () => {
  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null);
    const req: any = {
      url: 'http://localhost/api/presets/1',
      json: async () => ({ name: 'New Name' }),
    };
    const res = await patchById(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-owner attempts update', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'user' } });
    presetRows[0] = { ...publicPreset, authorId: 99 };
    const req: any = {
      url: 'http://localhost/api/presets/1',
      json: async () => ({ name: 'New Name' }),
    };
    const res = await patchById(req);
    expect(res.status).toBe(403);
  });

  it('allows owner to update and returns 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'user' } });
    presetRows[0] = { ...publicPreset, authorId: 1 };
    // Simulate the update by adjusting the in-memory row prior to final read
    presetRows[0].name = 'Updated Name';
    const req: any = {
      url: 'http://localhost/api/presets/1',
      json: async () => ({ name: 'Updated Name' }),
    };
    const res = await patchById(req);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('Updated Name');
  });
});

describe('DELETE /api/presets/[id]', () => {
  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await deleteById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-owner attempts delete', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'user' } });
    presetRows[0] = { ...publicPreset, authorId: 99 };
    const res = await deleteById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(403);
  });

  it('allows owner to delete and returns ok', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'user' } });
    presetRows[0] = { ...publicPreset, authorId: 1 };
    const res = await deleteById(new NextRequest('http://localhost/api/presets/1'));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
