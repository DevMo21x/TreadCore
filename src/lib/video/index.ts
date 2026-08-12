// =============================================================================
// VIDEO SERVICE – data-access layer
// =============================================================================
// Reads and writes from the SQLite database via Drizzle ORM.
// All API routes call only these functions.

import { eq, and } from 'drizzle-orm';
import db from '@/db';
import { videoCategories, videos as videosTable } from '@/db/schema';
import type { Video, VideoCategory } from '@/lib/video/types';
import { toTitleCase } from '@/lib/video/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToCategory(row: typeof videoCategories.$inferSelect): VideoCategory {
  return {
    id: row.id,
    name: row.name,
    thumbnailPath: row.thumbnailPath,
  };
}

function rowToVideo(row: typeof videosTable.$inferSelect): Video {
  return {
    id: row.id,
    filename: row.filename,
    title: row.title,
    categoryId: row.categoryId,
    thumbnailPath: row.thumbnailPath,
    videoPath: row.videoPath,
    isVisible: row.isVisible,
    createdAt: row.createdAt,
  };
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<VideoCategory[]> {
  const rows = await db.select().from(videoCategories);
  return rows.map(rowToCategory);
}

export async function getCategoryByName(name: string): Promise<VideoCategory | null> {
  const rows = await db
    .select()
    .from(videoCategories)
    .where(eq(videoCategories.name, name))
    .limit(1);
  return rows.length ? rowToCategory(rows[0]) : null;
}

export async function addCategory(data: Omit<VideoCategory, 'id'>): Promise<VideoCategory> {
  const inserted = await db
    .insert(videoCategories)
    .values({
      name: data.name.trim(),
      thumbnailPath: data.thumbnailPath ?? '',
    })
    .returning();
  return rowToCategory(inserted[0]);
}

export async function updateCategory(
  id: number,
  data: Partial<Omit<VideoCategory, 'id'>>
): Promise<VideoCategory | null> {
  const updated = await db
    .update(videoCategories)
    .set(data)
    .where(eq(videoCategories.id, id))
    .returning();
  return updated.length ? rowToCategory(updated[0]) : null;
}

export async function deleteCategory(
  id: number
): Promise<{ error?: string; deleted?: VideoCategory }> {
  const hasVideos =
    (await db.select().from(videosTable).where(eq(videosTable.categoryId, id)).limit(1)).length > 0;

  if (hasVideos) {
    return {
      error: 'Cannot delete a region that still has videos. Remove or reassign its videos first.',
    };
  }

  const deleted = await db.delete(videoCategories).where(eq(videoCategories.id, id)).returning();

  if (!deleted.length) return { error: 'Not found' };
  return { deleted: rowToCategory(deleted[0]) };
}

// ── Videos ────────────────────────────────────────────────────────────────────

export async function getVisibleVideos(categoryId?: number): Promise<Video[]> {
  const rows =
    categoryId !== undefined
      ? await db
          .select()
          .from(videosTable)
          .where(and(eq(videosTable.categoryId, categoryId), eq(videosTable.isVisible, true)))
      : await db.select().from(videosTable).where(eq(videosTable.isVisible, true));

  return rows.map(rowToVideo);
}

export async function getAllVideos(): Promise<(Video & { categoryName: string })[]> {
  const rows = await db
    .select({
      id: videosTable.id,
      filename: videosTable.filename,
      title: videosTable.title,
      categoryId: videosTable.categoryId,
      thumbnailPath: videosTable.thumbnailPath,
      videoPath: videosTable.videoPath,
      isVisible: videosTable.isVisible,
      createdAt: videosTable.createdAt,
      categoryName: videoCategories.name,
    })
    .from(videosTable)
    .leftJoin(videoCategories, eq(videosTable.categoryId, videoCategories.id));

  return rows.map((r) => ({
    id: r.id,
    filename: r.filename,
    title: r.title,
    categoryId: r.categoryId,
    thumbnailPath: r.thumbnailPath,
    videoPath: r.videoPath,
    isVisible: r.isVisible,
    createdAt: r.createdAt,
    categoryName: r.categoryName ?? 'Unknown',
  }));
}

export async function addVideo(data: Omit<Video, 'id' | 'createdAt'>): Promise<Video> {
  const inserted = await db
    .insert(videosTable)
    .values({
      filename: data.filename,
      title: data.title?.trim() || toTitleCase(data.filename),
      categoryId: data.categoryId,
      thumbnailPath: data.thumbnailPath,
      videoPath: data.videoPath,
      isVisible: data.isVisible !== false,
    })
    .returning();
  return rowToVideo(inserted[0]);
}

export async function updateVideo(
  id: number,
  data: Partial<Omit<Video, 'id' | 'createdAt'>>
): Promise<Video | null> {
  const updated = await db.update(videosTable).set(data).where(eq(videosTable.id, id)).returning();
  return updated.length ? rowToVideo(updated[0]) : null;
}

export async function deleteVideo(id: number): Promise<Video | null> {
  const deleted = await db.delete(videosTable).where(eq(videosTable.id, id)).returning();
  return deleted.length ? rowToVideo(deleted[0]) : null;
}
