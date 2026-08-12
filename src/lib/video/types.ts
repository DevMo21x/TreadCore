// =============================================================================
// VIDEO SYSTEM – TYPE DEFINITIONS
// =============================================================================
// Defines the Video and VideoCategory interfaces used across the video system.
// All data is persisted in src/data/videos.json via videoService.ts.

export interface VideoCategory {
  id: number;
  name: string;
  thumbnailPath: string;
}

export interface Video {
  id: number;
  filename: string;
  title: string;
  categoryId: number;
  thumbnailPath: string;
  videoPath: string;
  isVisible: boolean;
  createdAt: string;
}
