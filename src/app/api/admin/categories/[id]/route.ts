import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { updateCategory, deleteCategory } from '@/lib/video';

// PATCH /api/admin/categories/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const cat = await updateCategory(parseInt(id, 10), body);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cat);
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteCategory(parseInt(id, 10));
  if (result.error) {
    const status = result.error === 'Not found' ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.deleted);
}
