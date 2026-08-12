import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';
import { addVideo, getCategoryByName } from '@/lib/video';
import { videoFsDir, imageFsDir, videoUrl, imageUrl } from '@/lib/media/paths';

// POST /api/admin/upload
// Accepts multipart form data with:
//   - video: File (.mp4)               [required for new videos]
//   - thumbnail: File (.jpg/.png)      [optional]
//   - categoryName: string             (e.g. "North America")
//   - title: string                    [optional – auto-derived from filename]
//   - isVisible: string "true"/"false" [optional – defaults to true]
//
// Saves files to:
//   public/videos/{categoryName}/{filename}.mp4
//   public/images/{categoryName}/{filename}.jpg
//
// Registers the video in the store (later: DB) and returns the full Video record.
// For cover-image-only uploads (no video file) it returns { thumbnailPath } only.

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const categoryName = formData.get('categoryName') as string | null;
    const titleOverride = (formData.get('title') as string | null)?.trim() ?? '';
    const isVisible = formData.get('isVisible') !== 'false';

    if (!categoryName) {
      return NextResponse.json({ error: 'categoryName is required' }, { status: 400 });
    }

    if (!videoFile && !thumbnailFile) {
      return NextResponse.json(
        { error: 'at least one file (video or thumbnail) is required' },
        { status: 400 }
      );
    }

    // Derive the base filename from whichever file is present
    const primaryFile = videoFile ?? thumbnailFile!;
    const ext = path.extname(primaryFile.name);
    const baseName = path.basename(primaryFile.name, ext);

    // ── Save video ──────────────────────────────────────────────────────────
    let videoPath = '';
    if (videoFile) {
      const videoDir = videoFsDir(categoryName);
      await mkdir(videoDir, { recursive: true });
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(path.join(videoDir, videoFile.name), videoBuffer);
      videoPath = videoUrl(categoryName, videoFile.name);
    }

    // ── Save thumbnail (optional) ───────────────────────────────────────────
    let thumbnailPath = '';
    if (thumbnailFile && thumbnailFile.size > 0) {
      const thumbExt = path.extname(thumbnailFile.name);
      const thumbBaseName = videoFile
        ? baseName + thumbExt // match video base name when both uploaded
        : thumbnailFile.name; // use original name for cover-only uploads
      const imageDir = imageFsDir(categoryName);
      await mkdir(imageDir, { recursive: true });
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(path.join(imageDir, thumbBaseName), thumbBuffer);
      thumbnailPath = imageUrl(categoryName, thumbBaseName);
    }

    // ── Cover-image-only upload (no video) – used by the Regions tab ───────
    if (!videoFile) {
      return NextResponse.json({ thumbnailPath, filename: baseName });
    }

    // ── Register video in store / DB ────────────────────────────────────────
    const category = await getCategoryByName(categoryName);
    if (!category) {
      return NextResponse.json({ error: `Region "${categoryName}" not found` }, { status: 400 });
    }

    const video = await addVideo({
      filename: baseName,
      title: titleOverride,
      categoryId: category.id,
      thumbnailPath,
      videoPath,
      isVisible,
    });

    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
