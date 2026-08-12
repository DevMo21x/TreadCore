declare module '@/lib/media/paths' {
  export const MEDIA_DIR: string;
  export function videoFsDir(categoryName?: string): string;
  export function imageFsDir(categoryName?: string): string;
  export function videoFsPath(categoryName: string, filename: string): string;
  export function imageFsPath(categoryName: string, filename: string): string;
  export function videoUrl(categoryName: string, filename: string): string;
  export function imageUrl(categoryName: string, filename: string): string;
}
