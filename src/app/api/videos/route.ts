import { NextRequest, NextResponse } from 'next/server';
import { getVisibleVideos } from '@/lib/video';

// GET /api/videos?categoryId=1
// GET /api/videos          (returns all visible videos)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  if (categoryId !== null) {
    const id = parseInt(categoryId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
    }
    return NextResponse.json(await getVisibleVideos(id));
  }

  return NextResponse.json(await getVisibleVideos());
}
