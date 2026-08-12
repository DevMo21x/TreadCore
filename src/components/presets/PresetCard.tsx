'use client';
import React, { useState } from 'react';
import { usePresetRunner } from '@/hooks/usePresetRunner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Preset as PresetType } from '@/types/preset';
import { useErrorStore } from '@/stores';

export default function PresetCard({
  preset,
  onQuickStart,
  currentUserId,
  currentUserRole,
}: {
  preset: PresetType;
  onQuickStart?: (id: number) => void;
  currentUserId?: number | null;
  currentUserRole?: string | null;
}) {
  const [fav, setFav] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`preset_fav_${preset.id}`) === '1';
    } catch (e) {
      return false;
    }
  });

  function toggleFav() {
    try {
      const next = !fav;
      setFav(next);
      localStorage.setItem(`preset_fav_${preset.id}`, next ? '1' : '0');
    } catch (e) {
      setFav(!fav);
    }
  }

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const runner = usePresetRunner();

  return (
    <div className="border rounded-md p-4 shadow-sm flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold">
              <Link href={`/dashboard/presets/${preset.id}`} className="hover:underline">
                {preset.name}
              </Link>
            </h3>
            {preset.authorId == null ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Public
              </span>
            ) : null}
          </div>
          {/* description removed from card UI */}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            aria-label="favorite"
            onClick={toggleFav}
            className="text-yellow-500 hover:text-yellow-600 text-2xl"
          >
            {fav ? '★' : '☆'}
          </button>
          <div className="text-lg text-gray-500">{preset.difficulty}</div>
        </div>
      </div>

      {/* tags removed from card UI */}

      <div className="mt-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-xl"
            onClick={() => setConfirming(true)}
          >
            Quick Start
          </button>
          <Link
            href={`/dashboard/presets/${preset.id}`}
            className="border px-6 py-2 rounded text-lg text-gray-700 hover:bg-gray-50"
          >
            View
          </Link>
        </div>

        <div className="text-lg text-gray-600">
          {preset.totalDurationSeconds ? `${Math.round(preset.totalDurationSeconds / 60)} min` : ''}
        </div>
      </div>

      {deleteError ? <div className="mt-1 text-sm text-red-600">{deleteError}</div> : null}

      {confirming ? (
        <div className="mt-1 bg-gray-50 p-3 rounded">
          <div className="text-lg">Start &quot;{preset.name}&quot; now?</div>
          <div className="mt-3 flex gap-3">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <QuickStartConfirm
              presetId={preset.id}
              onQuickStart={onQuickStart}
              onClose={() => setConfirming(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuickStartConfirm({
  presetId,
  onQuickStart,
  onClose,
}: {
  presetId: number;
  onQuickStart?: (id: number) => void;
  onClose: () => void;
}) {
  const runner = usePresetRunner();
  const pushError = useErrorStore((state) => state.push);
  const [starting, setStarting] = useState(false);

  const handleConfirm = async () => {
    setStarting(true);
    try {
      if (onQuickStart) {
        onQuickStart(presetId);
      } else {
        await runner.startPresetById(presetId);
      }
      onClose();
    } catch (e) {
      console.error('Quick start failed', e);
      pushError({ title: 'Quick Start Failed', message: 'Failed to start preset.' });
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <button
        className="px-3 py-1 bg-green-600 text-white rounded"
        onClick={handleConfirm}
        disabled={starting}
      >
        {starting ? 'Starting...' : 'Confirm'}
      </button>
    </>
  );
}
