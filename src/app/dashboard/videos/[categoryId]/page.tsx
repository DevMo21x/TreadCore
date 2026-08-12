'use client';

import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import usePagination from '@/lib/hooks/usePagination';
import PaginationBar from '@/components/ui/PaginationBar';

interface Video {
  id: number;
  title: string;
  thumbnailPath: string;
  videoPath: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
}

const PAGE_SIZE = 3;

export default function CategoryVideosPage() {
  const router = useRouter();
  const { categoryId } = useParams<{ categoryId: string }>();

  const [videos, setVideos] = useState<Video[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Video | null>(null);
  const [videoBuffering, setVideoBuffering] = useState(false);

  const { pageSlice, currentPage, pageCount, prev, next } = usePagination(videos, PAGE_SIZE);

  useEffect(() => {
    Promise.all([
      fetch(`/api/videos?categoryId=${categoryId}`).then((r) => r.json()),
      fetch('/api/videos/categories').then((r) => r.json()),
    ]).then(([vids, cats]) => {
      setVideos(vids as Video[]);
      const cat = (cats as Category[]).find((c) => c.id === Number(categoryId));
      setCategory(cat ?? null);
      setLoading(false);
    });
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center rounded-3xl bg-[var(--hg-surface-soft)]">
        <p className="animate-pulse text-xl text-[var(--hg-text)]">Loading videos...</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="flex h-full flex-col rounded-3xl bg-[var(--hg-surface-soft)]">
        <div className="flex items-center gap-4 py-2 px-4">
          <button
            onClick={() => setSelected(null)}
            className="rounded-lg bg-[color:var(--hg-interactive-muted)] px-4 py-2 text-xl text-[var(--hg-text)] transition hover:bg-[color:var(--hg-interactive-strong)]"
          >
            {'<-'} Back
          </button>
          <h2 className="text-xl font-semibold text-[var(--hg-text)]">{selected.title}</h2>
        </div>
        <div className="relative flex flex-1 min-h-0 items-center justify-center">
          {videoBuffering && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--hg-separator)] border-t-[color:var(--hg-primary)]" />
            </div>
          )}
          <video
            key={selected.videoPath}
            src={selected.videoPath}
            controls
            autoPlay
            onWaiting={() => setVideoBuffering(true)}
            onCanPlay={() => setVideoBuffering(false)}
            onPlaying={() => setVideoBuffering(false)}
            className="w-full max-h-[720px] bg-black"
          >
            <track kind="captions" />
          </video>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-3xl bg-[var(--hg-surface-soft)] p-6">
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/videos')}
          className="rounded-lg bg-[color:var(--hg-interactive-muted)] px-4 py-2 text-sm text-[var(--hg-text)] transition hover:bg-[color:var(--hg-interactive-strong)]"
        >
          {'<-'} Regions
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--hg-text)]">{category?.name}</h1>
          <p className="text-gray-400">{videos.length} videos available</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {pageSlice.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelected(video)}
              className="group relative aspect-video overflow-hidden rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Image
                src={video.thumbnailPath}
                alt={video.title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--hg-tooltip-surface)]">
                  <svg
                    className="ml-1 h-6 w-6 text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-4 left-4 right-4 line-clamp-2 text-left text-sm font-medium text-white drop-shadow">
                {video.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <PaginationBar currentPage={currentPage} pageCount={pageCount} onPrev={prev} onNext={next} />
    </div>
  );
}
