import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { getAllVideos } from '@/lib/video';

// GET /api/admin/videos
export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const videos = await getAllVideos();
  return NextResponse.json(videos);
}
