'use client';

import { useEffect, useRef, useState } from 'react';

interface Category {
  id: number;
  name: string;
  thumbnailPath: string;
}

interface Video {
  id: number;
  filename: string;
  title: string;
  categoryId: number;
  categoryName: string;
  thumbnailPath: string;
  videoPath: string;
  isVisible: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  title: '',
  categoryId: '',
  isVisible: true,
};

const EMPTY_CAT_FORM = { name: '', thumbnailPath: '' };

export default function AdminVideosPage() {
  const [tab, setTab] = useState<'videos' | 'regions'>('videos');

  // ── Video state ──────────────────────────────────────────────────────────
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // ── Region state ─────────────────────────────────────────────────────────
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CAT_FORM);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState('');
  const catThumbRef = useRef<HTMLInputElement>(null);

  // File refs — only used when adding a new video
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [vRes, cRes] = await Promise.all([
      fetch('/api/admin/videos'),
      fetch('/api/videos/categories'),
    ]);
    setVideos(await vRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function getCategoryName(catId: number | string): string {
    return categories.find((c) => c.id === Number(catId))?.name ?? '';
  }

  // When admin picks a video file, auto-fill title from filename
  function handleVideoFileChange(file: File | null) {
    if (!file) return;
    const ext = file.name.lastIndexOf('.');
    const baseName = ext !== -1 ? file.name.slice(0, ext) : file.name;
    setForm((f) => ({
      ...f,
      title: f.title || toTitleCase(baseName),
    }));
  }

  // When admin picks a thumbnail — no form state needed, file ref holds it
  function handleThumbFileChange(_file: File | null) {
    // intentionally empty — thumbnail is read from ref on submit
    setForm((f) => ({
      ...f,
      ...f,
    }));
  }

  function handleCategoryChange(value: string) {
    setForm((f) => ({ ...f, categoryId: value }));
  }

  function toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/ - /g, ' – ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    setUploadProgress('');

    try {
      if (editingId !== null) {
        // Edit: PATCH only the metadata fields
        const res = await fetch(`/api/admin/videos/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            categoryId: Number(form.categoryId),
            isVisible: form.isVisible,
          }),
        });
        if (!res.ok) {
          const body = await res.json();
          setError(body.error ?? 'Something went wrong');
        } else {
          setSuccess('Video updated!');
          setShowForm(false);
          setForm(EMPTY_FORM);
          setEditingId(null);
          await load();
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        // New video: upload files + register in one request
        const videoFile = videoFileRef.current?.files?.[0];
        if (!videoFile) {
          setError('Please select a video file to upload.');
          return;
        }

        const catName = getCategoryName(form.categoryId);
        if (!catName) {
          setError('Please select a region.');
          return;
        }

        setUploadProgress('Uploading…');
        const uploadData = new FormData();
        uploadData.append('video', videoFile);
        const thumbFile = thumbFileRef.current?.files?.[0];
        if (thumbFile) uploadData.append('thumbnail', thumbFile);
        uploadData.append('categoryName', catName);
        if (form.title.trim()) uploadData.append('title', form.title.trim());
        uploadData.append('isVisible', String(form.isVisible));

        const res = await fetch('/api/admin/upload', { method: 'POST', body: uploadData });
        if (!res.ok) {
          const body = await res.json();
          setError(body.error ?? 'Upload failed');
        } else {
          setSuccess('Video added!');
          setShowForm(false);
          setForm(EMPTY_FORM);
          setUploadProgress('');
          await load();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(video: Video) {
    await fetch(`/api/admin/videos/${video.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !video.isVisible }),
    });
    await load();
  }

  async function handleDelete(video: Video) {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/videos/${video.id}`, { method: 'DELETE' });
    await load();
  }

  function openEdit(video: Video) {
    setForm({
      title: video.title,
      categoryId: String(video.categoryId),
      isVisible: video.isVisible,
    });
    setEditingId(video.id);
    setShowForm(true);
    setError('');
    setUploadProgress('');
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setUploadProgress('');
  }

  // ── Region handlers ──────────────────────────────────────────────────────
  function openAddRegion() {
    setCatForm(EMPTY_CAT_FORM);
    setEditingCatId(null);
    setShowCatForm(true);
    setCatError('');
  }

  function openEditRegion(cat: Category) {
    setCatForm({ name: cat.name, thumbnailPath: cat.thumbnailPath });
    setEditingCatId(cat.id);
    setShowCatForm(true);
    setCatError('');
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    setCatError('');

    try {
      // Upload thumbnail if a file was selected
      let thumbnailPath = catForm.thumbnailPath;
      const thumbFile = catThumbRef.current?.files?.[0];
      if (thumbFile) {
        const fd = new FormData();
        fd.append('thumbnail', thumbFile);
        fd.append('categoryName', catForm.name.trim());
        const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        if (upRes.ok) {
          const up = await upRes.json();
          if (up.thumbnailPath) thumbnailPath = up.thumbnailPath;
        }
      }

      let res: Response;
      if (editingCatId !== null) {
        res = await fetch(`/api/admin/categories/${editingCatId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catForm.name.trim(), thumbnailPath }),
        });
      } else {
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catForm.name.trim(), thumbnailPath }),
        });
      }

      if (!res.ok) {
        const body = await res.json();
        setCatError(body.error ?? 'Something went wrong');
      } else {
        setSuccess(editingCatId !== null ? 'Region updated!' : 'Region created!');
        setShowCatForm(false);
        setCatForm(EMPTY_CAT_FORM);
        setEditingCatId(null);
        await load();
        setTimeout(() => setSuccess(''), 3000);
      }
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteRegion(cat: Category) {
    if (!confirm(`Delete region "${cat.name}"? This will fail if it still has videos.`)) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json();
      alert(body.error ?? 'Delete failed');
    } else {
      await load();
    }
  }

  const filtered = videos.filter((v) => {
    const matchCat = filterCat === 'all' || v.categoryId === Number(filterCat);
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="animate-pulse text-[var(--hg-muted)]">Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between border-b border-[color:var(--hg-border-soft)] bg-[rgba(19,19,19,0.6)] px-8 py-4 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-[var(--hg-text)]">Video Manager</h1>
          <p className="text-sm text-[var(--hg-muted)]">
            {videos.length} videos · {categories.length} regions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/videos"
            target="_blank"
            className="text-sm text-[color:var(--hg-secondary)] hover:underline"
          >
            View user side ↗
          </a>
          {tab === 'videos' ? (
            <button
              onClick={openAdd}
              className="rounded-lg bg-[color:var(--hg-secondary)] px-4 py-2 text-sm font-bold tracking-[0.08em] text-black transition hover:opacity-90"
            >
              + Add Video
            </button>
          ) : (
            <button
              onClick={openAddRegion}
              className="rounded-lg bg-[color:var(--hg-secondary)] px-4 py-2 text-sm font-bold tracking-[0.08em] text-black transition hover:opacity-90"
            >
              + Add Region
            </button>
          )}
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-[color:var(--hg-border-soft)] px-8">
        <button
          onClick={() => setTab('regions')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'regions'
              ? 'border-[color:var(--hg-secondary)] text-[var(--hg-text)]'
              : 'border-transparent text-[var(--hg-muted)] hover:text-[var(--hg-text)]'
          }`}
        >
          Regions
        </button>
        <button
          onClick={() => setTab('videos')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'videos'
              ? 'border-[color:var(--hg-secondary)] text-[var(--hg-text)]'
              : 'border-transparent text-[var(--hg-muted)] hover:text-[var(--hg-text)]'
          }`}
        >
          Videos
        </button>
      </div>

      {/* ── Success toast ── */}
      {success && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-3 text-green-400 shadow-lg">
          {success}
        </div>
      )}

      {/* ── Regions tab ── */}
      {tab === 'regions' && (
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--hg-border-soft)] text-left text-[11px] font-bold tracking-[0.2em] text-[var(--hg-muted)]">
                <th className="pb-3 pr-4">Region Name</th>
                <th className="pb-3 pr-4">Cover Image Path</th>
                <th className="pb-3 pr-4">Videos</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[color:var(--hg-border-soft)] hover:bg-white/5 transition"
                >
                  <td className="py-3 pr-4 font-medium">{cat.name}</td>
                  <td className="max-w-60 truncate py-3 pr-4 font-mono text-xs text-[var(--hg-muted)]">
                    {cat.thumbnailPath || (
                      <span className="italic text-[var(--hg-muted)]">none</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[var(--hg-muted)]">
                    {videos.filter((v) => v.categoryId === cat.id).length}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditRegion(cat)}
                        className="rounded px-3 py-1 text-xs text-[color:var(--hg-secondary)] transition bg-[color:var(--hg-secondary)]/10 hover:bg-[color:var(--hg-secondary)]/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRegion(cat)}
                        className="rounded px-3 py-1 text-xs text-red-400 transition bg-red-400/10 hover:bg-red-400/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Region form modal ── */}
      {showCatForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-[color:var(--hg-border-soft)]">
            <div className="flex items-center justify-between border-b border-[color:var(--hg-border-soft)] p-6">
              <h2 className="text-lg font-semibold">
                {editingCatId !== null ? 'Edit Region' : 'Add New Region'}
              </h2>
              <button
                onClick={() => {
                  setShowCatForm(false);
                  setCatError('');
                }}
                className="text-xl leading-none text-[var(--hg-muted)] transition hover:text-[var(--hg-text)]"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="cat-name" className="mb-1 block text-sm text-[var(--hg-muted)]">
                  Region Name *
                </label>
                <input
                  id="cat-name"
                  required
                  type="text"
                  placeholder="e.g. Central America"
                  value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 text-[var(--hg-text)] placeholder:text-[var(--hg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hg-secondary)]"
                />
              </div>

              <div>
                <label htmlFor="cat-thumb" className="mb-1 block text-sm text-[var(--hg-muted)]">
                  Cover image <span className="text-[var(--hg-muted)]">(optional)</span>
                </label>
                <input
                  id="cat-thumb"
                  ref={catThumbRef}
                  type="file"
                  accept="image/*"
                  className="w-full cursor-pointer text-sm text-[var(--hg-muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-[var(--hg-text)] hover:file:bg-white/20"
                />
                {catForm.thumbnailPath && (
                  <p className="mt-1 font-mono text-xs text-[var(--hg-muted)]">
                    {catForm.thumbnailPath}
                  </p>
                )}
              </div>

              {catError && (
                <p className="rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 text-sm text-red-400">
                  {catError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCatForm(false);
                    setCatError('');
                  }}
                  className="rounded-lg bg-white/5 px-4 py-2 text-sm text-[var(--hg-muted)] transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="rounded-lg bg-[color:var(--hg-secondary)] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {catSaving ? 'Saving…' : editingCatId !== null ? 'Save Changes' : 'Create Region'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Videos tab ── */}
      {tab === 'videos' && (
        <>
          {/* ── Filters ── */}
          <div className="flex flex-wrap items-center gap-4 border-b border-[color:var(--hg-border-soft)] px-8 py-5">
            <input
              type="text"
              placeholder="Search videos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-2 text-sm text-[var(--hg-text)] placeholder:text-[var(--hg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hg-secondary)]"
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-4 py-2 text-sm text-[var(--hg-text)] focus:outline-none focus:ring-2 focus:ring-[var(--hg-secondary)]"
            >
              <option value="all">All Regions</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="ml-auto text-sm text-[var(--hg-muted)]">
              {filtered.length} results
            </span>
          </div>

          {/* ── Video Table ── */}
          <div className="px-8 py-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--hg-border-soft)] text-left text-[11px] font-bold tracking-[0.2em] text-[var(--hg-muted)]">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Region</th>
                  <th className="pb-3 pr-4">Filename</th>
                  <th className="pb-3 pr-4">Added</th>
                  <th className="pb-3 pr-4">Visible</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((video) => (
                  <tr
                    key={video.id}
                    className="border-b border-[color:var(--hg-border-soft)] hover:bg-white/5 transition"
                  >
                    <td className="py-3 pr-4 font-medium">{video.title}</td>
                    <td className="py-3 pr-4 text-[var(--hg-muted)]">{video.categoryName}</td>
                    <td className="max-w-50 truncate py-3 pr-4 font-mono text-xs text-[var(--hg-muted)]">
                      {video.filename}
                    </td>
                    <td className="py-3 pr-4 text-[var(--hg-muted)]">{video.createdAt}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => toggleVisible(video)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          video.isVisible ? 'bg-green-500' : 'bg-gray-600'
                        } relative`}
                        title={
                          video.isVisible ? 'Visible – click to hide' : 'Hidden – click to show'
                        }
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            video.isVisible ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(video)}
                          className="rounded px-3 py-1 text-xs text-[color:var(--hg-secondary)] transition bg-[color:var(--hg-secondary)]/10 hover:bg-[color:var(--hg-secondary)]/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(video)}
                          className="rounded px-3 py-1 text-xs text-red-400 transition bg-red-400/10 hover:bg-red-400/20"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="py-16 text-center text-[var(--hg-muted)]">
                No videos match your filters.
              </p>
            )}
          </div>

          {/* ── Add / Edit Form Modal ── */}
          {showForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[color:var(--hg-border-soft)]">
                <div className="flex items-center justify-between border-b border-[color:var(--hg-border-soft)] p-6">
                  <h2 className="text-lg font-semibold">
                    {editingId !== null ? 'Edit Video' : 'Add New Video'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                      setUploadProgress('');
                    }}
                    className="text-xl leading-none text-[var(--hg-muted)] transition hover:text-[var(--hg-text)]"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Region */}
                  <div>
                    <label
                      htmlFor="video-region"
                      className="mb-1 block text-sm text-[var(--hg-muted)]"
                    >
                      Region *
                    </label>
                    <select
                      id="video-region"
                      required
                      value={form.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 text-[var(--hg-text)] focus:outline-none focus:ring-2 focus:ring-[var(--hg-secondary)]"
                    >
                      <option value="">Select a region…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ── File upload section (new videos only) ── */}
                  {editingId === null && (
                    <div className="space-y-3 rounded-xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--hg-muted)]">
                        Upload Files
                      </p>

                      <div>
                        <label
                          htmlFor="video-file"
                          className="mb-1 block text-sm text-[var(--hg-text)]"
                        >
                          Video file <span className="text-red-400">*</span>
                          <span className="ml-1 text-[var(--hg-muted)]">(.mp4)</span>
                        </label>
                        <input
                          id="video-file"
                          ref={videoFileRef}
                          type="file"
                          accept="video/mp4,video/*"
                          onChange={(e) => handleVideoFileChange(e.target.files?.[0] ?? null)}
                          className="w-full cursor-pointer text-sm text-[var(--hg-muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[color:var(--hg-secondary)] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-black hover:file:opacity-90"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="thumb-file"
                          className="mb-1 block text-sm text-[var(--hg-text)]"
                        >
                          Thumbnail image
                          <span className="ml-1 text-[var(--hg-muted)]">
                            (.jpg / .png — optional)
                          </span>
                        </label>
                        <input
                          id="thumb-file"
                          ref={thumbFileRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleThumbFileChange(e.target.files?.[0] ?? null)}
                          className="w-full cursor-pointer text-sm text-[var(--hg-muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-[var(--hg-text)] hover:file:bg-white/20"
                        />
                        <p className="mt-1 text-xs text-[var(--hg-muted)]">
                          If omitted, no thumbnail will be shown for this video.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Display title */}
                  <div>
                    <label
                      htmlFor="video-title"
                      className="mb-1 block text-sm text-[var(--hg-muted)]"
                    >
                      Display Title{' '}
                      <span className="text-[var(--hg-muted)]">
                        (optional – auto-derived from filename)
                      </span>
                    </label>
                    <input
                      id="video-title"
                      type="text"
                      placeholder="Leave blank to use filename as title"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 text-[var(--hg-text)] placeholder:text-[var(--hg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hg-secondary)]"
                    />
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center gap-3">
                    <input
                      id="visible"
                      type="checkbox"
                      checked={form.isVisible}
                      onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="visible" className="text-sm text-[var(--hg-muted)]">
                      Visible to users
                    </label>
                  </div>

                  {/* Upload progress */}
                  {uploadProgress && (
                    <p className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[color:var(--hg-secondary)] bg-[color:var(--hg-secondary)]/10">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[color:var(--hg-secondary)] border-t-transparent" />
                      {uploadProgress}
                    </p>
                  )}

                  {error && (
                    <p className="rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-soft)] px-3 py-2 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setError('');
                        setUploadProgress('');
                      }}
                      className="rounded-lg bg-white/5 px-4 py-2 text-sm text-[var(--hg-muted)] transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-[color:var(--hg-secondary)] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : editingId !== null ? 'Save Changes' : 'Upload & Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
