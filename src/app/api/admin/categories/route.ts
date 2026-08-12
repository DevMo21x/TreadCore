import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { getCategories, addCategory } from '@/lib/video';

// GET /api/admin/categories
export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(await getCategories());
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, thumbnailPath } = body;

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const newCategory = await addCategory({
    name: String(name).trim(),
    thumbnailPath: String(thumbnailPath ?? ''),
  });
  return NextResponse.json(newCategory, { status: 201 });
}
