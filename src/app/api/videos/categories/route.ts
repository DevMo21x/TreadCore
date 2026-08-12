import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/video';

// GET /api/videos/categories
export async function GET() {
  return NextResponse.json(await getCategories());
}
