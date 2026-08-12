import path from 'path';

export const MEDIA_DIR: string = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'media');

function safeSegment(segment?: string) {
  if (!segment) return '';
  return segment.replace(/^\/+|\/+$/g, '');
}

export function videoFsDir(categoryName?: string): string {
  const cat = safeSegment(categoryName);
  return path.resolve(MEDIA_DIR, 'videos', cat);
}

export function imageFsDir(categoryName?: string): string {
  const cat = safeSegment(categoryName);
  return path.resolve(MEDIA_DIR, 'images', cat);
}

export function videoFsPath(categoryName: string, filename: string): string {
  return path.resolve(videoFsDir(categoryName), filename);
}

export function imageFsPath(categoryName: string, filename: string): string {
  return path.resolve(imageFsDir(categoryName), filename);
}

export function videoUrl(categoryName: string, filename: string): string {
  const cat = encodeURIComponent(safeSegment(categoryName));
  const file = encodeURIComponent(filename);
  return `/api/media/videos/${cat}/${file}`;
}

export function imageUrl(categoryName: string, filename: string): string {
  const cat = encodeURIComponent(safeSegment(categoryName));
  const file = encodeURIComponent(filename);
  return `/api/media/images/${cat}/${file}`;
}

const mediaPaths = {
  MEDIA_DIR,
  videoFsDir,
  imageFsDir,
  videoFsPath,
  imageFsPath,
  videoUrl,
  imageUrl,
};

export default mediaPaths;
