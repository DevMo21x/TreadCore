// =============================================================================
// VIDEO SCAN – file-system → database sync
// =============================================================================
// Runs at app startup (via instrumentation.ts) to ensure the database reflects
// the current state of public/videos/.  Safe to run repeatedly (idempotent).
//
// Behaviour:
//   1. Reads every sub-folder of public/videos/ (one folder = one category).
//   2. Ensures each category exists in the DB; creates it if missing.
//   3. For each .mp4 inside a category folder, ensures a video row exists in
//      the DB; creates it if missing (preserving any existing row untouched).
//   4. Attempts to locate a matching thumbnail under public/images/ by base
//      name (case-insensitive).  Falls back to '' if none is found.
//   5. Sets the category thumbnailPath to the first image whose stem matches
//      the category name (e.g. "Africa.jpg") when the category is first
//      created or when the path is currently empty.

import fs from 'fs';
import path from 'path';
import { MEDIA_DIR, videoUrl, imageUrl } from '@/lib/media/paths';
import { eq, and } from 'drizzle-orm';
import db from '@/db';
import { videoCategories, videos as videosTable } from '@/db/schema';
import { toTitleCase } from '@/lib/video/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return all immediate sub-directories of a directory. */
function listSubDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/** Return all files inside a directory (non-recursive). */
function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((f) => f.isFile())
    .map((f) => f.name);
}

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/**
 * Look for an image whose base name (without extension) matches `stem`
 * inside `imageDir`.  Returns the public URL path or '' if not found.
 */
function findThumbnail(imageDir: string, stem: string, category: string): string {
  if (!fs.existsSync(imageDir)) return '';
  const lower = stem.toLowerCase();
  const files = listFiles(imageDir);
  const match = files.find((f) => {
    const ext = path.extname(f);
    if (!IMAGE_EXTS.has(ext.toLowerCase())) return false;
    return path.basename(f, ext).toLowerCase() === lower;
  });
  if (!match) return '';
  return imageUrl(category, match);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scanVideos(): Promise<void> {
  const videosDir = path.join(MEDIA_DIR, 'videos');
  const imagesDir = path.join(MEDIA_DIR, 'images');

  const categoryFolders = listSubDirs(videosDir);

  for (const categoryName of categoryFolders) {
    // ── 1. Upsert category ────────────────────────────────────────────────
    const existingCats = await db
      .select()
      .from(videoCategories)
      .where(eq(videoCategories.name, categoryName))
      .limit(1);

    let categoryId: number;

    if (existingCats.length === 0) {
      const categoryImageDir = path.join(imagesDir, categoryName);
      const categoryThumb = findThumbnail(categoryImageDir, categoryName, categoryName);

      const inserted = await db
        .insert(videoCategories)
        .values({ name: categoryName, thumbnailPath: categoryThumb })
        .returning();

      categoryId = inserted[0].id;
      console.log(`[scan] Created category: ${categoryName}`);
    } else {
      categoryId = existingCats[0].id;

      // Fill in a missing category thumbnail if one exists on disk
      if (!existingCats[0].thumbnailPath) {
        const categoryImageDir = path.join(imagesDir, categoryName);
        const categoryThumb = findThumbnail(categoryImageDir, categoryName, categoryName);
        if (categoryThumb) {
          await db
            .update(videoCategories)
            .set({ thumbnailPath: categoryThumb })
            .where(eq(videoCategories.id, categoryId));
          console.log(`[scan] Updated thumbnail for category: ${categoryName}`);
        }
      }
    }

    // ── 2. Process video files ────────────────────────────────────────────
    const categoryVideoDir = path.join(videosDir, categoryName);
    const categoryImageDir = path.join(imagesDir, categoryName);
    const videoFiles = listFiles(categoryVideoDir).filter(
      (f) => path.extname(f).toLowerCase() === '.mp4'
    );

    for (const filename of videoFiles) {
      const baseName = path.basename(filename, path.extname(filename));

      // Check whether this video already exists in the DB
      const existing = await db
        .select()
        .from(videosTable)
        .where(and(eq(videosTable.filename, baseName), eq(videosTable.categoryId, categoryId)))
        .limit(1);

      if (existing.length > 0) continue; // already tracked – leave it alone

      const videoPath = `/videos/${categoryName}/${filename}`;
      const thumbnailPath = findThumbnail(categoryImageDir, baseName, categoryName);
      const title = toTitleCase(baseName);

      await db.insert(videosTable).values({
        filename: baseName,
        title,
        categoryId,
        thumbnailPath,
        videoPath,
        isVisible: true,
      });

      console.log(`[scan] Registered video: ${categoryName}/${filename}`);
    }
  }
}
