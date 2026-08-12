import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { updateVideo, deleteVideo } from '@/lib/video';

// PATCH /api/admin/videos/[id]  – update a video (title, isVisible, etc.)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const video = await updateVideo(parseInt(id, 10), body);
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(video);
}

// DELETE /api/admin/videos/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const deleted = await deleteVideo(parseInt(id, 10));
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(deleted);
}
