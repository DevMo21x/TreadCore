'use client';

import React from 'react';
import { usePresetRunner } from '@/hooks/usePresetRunner';

function formatSeconds(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function PresetRunnerPill() {
  const { activePreset, currentSegmentIndex, segmentTimeRemaining, cancelPreset, isPaused } =
    usePresetRunner();

  if (!activePreset) return null;

  const segments = activePreset.segments ?? [];
  const seg = segments[currentSegmentIndex];
  const segmentName = seg?.name || `Segment ${currentSegmentIndex + 1}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelPreset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cancelPreset();
    }
  };

  return (
    <div
      className="preset-runner-pill"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Preset runner: ${activePreset.name}, ${segmentName}, ${formatSeconds(segmentTimeRemaining)} remaining${isPaused ? ', paused' : ''}. Click to cancel.`}
      title={isPaused ? 'Preset paused — click to cancel' : 'Click to cancel preset'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 9999,
        background: isPaused ? 'rgba(255,165,0,0.95)' : 'rgba(0,0,0,0.6)',
        color: isPaused ? '#000' : '#fff',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      <strong style={{ marginRight: 6 }}>{activePreset.name}</strong>
      {isPaused && (
        <span
          aria-hidden
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <rect x="5" y="4" width="4" height="16" fill={isPaused ? '#000' : '#fff'} />
            <rect x="15" y="4" width="4" height="16" fill={isPaused ? '#000' : '#fff'} />
          </svg>
        </span>
      )}
      <span style={{ opacity: 0.9 }}>{segmentName}</span>
      <span style={{ marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>
        {formatSeconds(segmentTimeRemaining)}
      </span>
    </div>
  );
}
