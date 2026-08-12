import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { MEDIA_DIR } from '@/lib/media/paths';

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const unwrapped = await params;
    const segments = unwrapped?.path ?? [];
    if (!segments.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Resolve requested path inside MEDIA_DIR and prevent traversal
    const requested = path.join(...segments.map((s) => String(s)));
    const fullPath = path.resolve(MEDIA_DIR, requested);
    const mediaRoot = path.resolve(MEDIA_DIR);
    if (!fullPath.startsWith(mediaRoot + path.sep) && fullPath !== mediaRoot) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure the file exists before streaming
    const stats = await fs.promises.stat(fullPath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const fileSize = stats.size;
    const rangeHeader = request.headers.get('range');
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME[ext] ?? 'application/octet-stream';

    const commonHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };

    if (rangeHeader) {
      const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (!m) return NextResponse.json({ error: 'Invalid Range' }, { status: 416 });
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), fileSize - 1) : fileSize - 1;
      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
        return NextResponse.json({ error: 'Range Not Satisfiable' }, { status: 416 });
      }
      const chunkSize = end - start + 1;
      const headers = {
        ...commonHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(chunkSize),
      };
      const nodeStream = fs.createReadStream(fullPath, { start, end });
      const webStream = Readable.toWeb(
        nodeStream as Readable
      ) as unknown as ReadableStream<Uint8Array>;
      return new NextResponse(webStream, { status: 206, headers });
    }

    // Full file
    const headers = { ...commonHeaders, 'Content-Length': String(fileSize) };
    const nodeStream = fs.createReadStream(fullPath);
    const webStream = Readable.toWeb(
      nodeStream as Readable
    ) as unknown as ReadableStream<Uint8Array>;
    return new NextResponse(webStream, { status: 200, headers });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('Media route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
