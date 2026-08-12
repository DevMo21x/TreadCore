'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
  thumbnailPath: string;
}

export default function VideosPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/videos/categories')
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center rounded-3xl bg-[var(--hg-surface-soft)]">
        <p className="animate-pulse text-xl text-[var(--hg-text)]">Loading regions...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <p className="mb-2 text-[11px] font-bold tracking-[0.34em] text-[var(--hg-secondary)]">
        SCENIC ROUTES
      </p>
      <h1 className="mb-2 text-3xl font-bold tracking-[-0.04em] text-[var(--hg-text)]">
        Scenic Routes
      </h1>
      <p className="mb-8 text-[var(--hg-muted)]">Choose a region to explore</p>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => router.push(`/dashboard/videos/${cat.id}`)}
            className="glass-panel group relative aspect-video overflow-hidden rounded-xl border border-[color:var(--hg-border-soft)] transition-colors duration-200 hover:border-[color:var(--hg-secondary)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--hg-secondary)]/50"
          >
            <Image
              src={cat.thumbnailPath}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/placeholder.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-4 left-4 text-[12px] font-bold tracking-widest text-[var(--hg-text)] drop-shadow">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
