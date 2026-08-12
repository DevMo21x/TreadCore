import React from 'react';
import type { Segment } from '@/types/preset';

import { useEffect } from 'react';

export default function SegmentCard({
  segment,
  index,
  start,
  onChangeDuration,
  onChangeSpeed,
  onChangeIncline,
  onChangeName,
  onMoveUp,
  onMoveDown,
  onDelete,
  calories,
  readOnly = false,
  durationStep = 10,
}: {
  segment: Segment & { start: number; end: number };
  index: number;
  start: number;
  calories: number;
  readOnly?: boolean;
  durationStep?: number;
  onChangeDuration: (i: number, seconds: number) => void;
  onChangeSpeed: (i: number, delta: number) => void;
  onChangeIncline: (i: number, delta: number) => void;
  onChangeName?: (i: number, name: string) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onDelete: (i: number) => void;
}) {
  const duration = segment.end - segment.start || segment.duration_seconds || 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  function generateSegmentName(seg: Segment) {
    const dur =
      seg.duration_seconds ??
      ((seg as any).end && (seg as any).start ? (seg as any).end - (seg as any).start : 0);
    const mins = dur >= 60 ? `${Math.round(dur / 60)}m` : `${dur}s`;
    const sp = typeof seg.speed === 'number' ? seg.speed.toFixed(1) : '0.0';
    const inc = typeof seg.incline === 'number' ? seg.incline : null;
    return `${mins} at ${sp}km/h${inc && inc !== 0 ? ` on ${inc}% incline` : ''}`;
  }

  const colorClass = () => {
    // color by index so adjacent segments are visually distinct; fallback to blue
    return ['bg-blue-500', 'bg-green-500', 'bg-purple-500'][index % 3] || 'bg-blue-500';
  };

  // Hold the latest onChangeName in a ref so the effect never depends on
  // the prop directly — prevents an infinite render loop when the parent
  // passes an inline function that changes reference every render.
  const onChangeNameRef = React.useRef(onChangeName);
  useEffect(() => {
    onChangeNameRef.current = onChangeName;
  });

  // update generated name live and persist via onChangeName if provided
  useEffect(() => {
    if (readOnly) return;
    const gen = generateSegmentName({
      duration_seconds: segment.duration_seconds,
      speed: segment.speed,
      incline: segment.incline,
    } as Segment);
    if (onChangeNameRef.current) {
      onChangeNameRef.current(index, gen);
    }
  }, [segment.duration_seconds, segment.speed, segment.incline, index, readOnly]);

  // Shared stepper button style
  const stepBtn =
    'w-16 h-16 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-2xl font-bold text-gray-700 transition select-none';

  // Quick-add pill style

  return (
    <div
      style={{ gridTemplateColumns: '40px 260px 1fr 320px 260px 260px 1fr' }}
      className="w-full grid items-start gap-x-6 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition"
      role="row"
    >
      {/* # */}
      <div className="flex items-center justify-center self-stretch">
        <span className="text-lg font-semibold text-gray-600">{index + 1}</span>
      </div>

      {/* Segment */}
      <div className="flex items-center gap-3 min-w-0 py-2">
        <div
          className={`h-16 w-16 shrink-0 rounded-lg flex items-center justify-center text-white ${colorClass()}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="min-w-0 max-w-full">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-900 truncate leading-tight text-xl max-w-[220px]">
              {generateSegmentName(segment)}
            </div>
          </div>

          <div className="text-sm text-gray-600 mt-0.5">
            {fmt(duration)} · {calories} kcal
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div />

      {/* Duration */}
      <div className="flex flex-col items-start gap-2 pt-0">
        {readOnly ? (
          <span className="text-2xl font-semibold text-gray-800 tabular-nums">{fmt(duration)}</span>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => onChangeDuration(index, -durationStep)} className={stepBtn}>
                −
              </button>
              <span className="w-28 text-center text-2xl font-semibold text-gray-800 tabular-nums">
                {fmt(duration)}
              </span>
              <button onClick={() => onChangeDuration(index, durationStep)} className={stepBtn}>
                +
              </button>
            </div>
          </>
        )}
      </div>

      {/* Speed */}
      <div className="flex flex-col items-start gap-1.5 pt-0">
        {readOnly ? (
          <>
            <span className="text-2xl font-semibold text-gray-800 tabular-nums">
              {(segment.speed ?? 0).toFixed(1)} km/h
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => onChangeSpeed(index, -0.5)} className={stepBtn}>
                −
              </button>
              <span className="w-20 text-center text-2xl font-semibold text-gray-800 tabular-nums">
                {(segment.speed ?? 0).toFixed(1)} km/h
              </span>
              <button onClick={() => onChangeSpeed(index, 0.5)} className={stepBtn}>
                +
              </button>
            </div>
          </>
        )}
      </div>

      {/* Incline */}
      <div className="flex flex-col items-start gap-1.5 pt-0">
        {readOnly ? (
          <>
            <span className="text-2xl font-semibold text-gray-800 tabular-nums">
              {(segment.incline ?? 0).toFixed(1)} %
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => onChangeIncline(index, -1)} className={stepBtn}>
                −
              </button>
              <span className="w-20 text-center text-2xl font-semibold text-gray-800 tabular-nums">
                {(segment.incline ?? 0).toFixed(1)} %
              </span>
              <button onClick={() => onChangeIncline(index, 1)} className={stepBtn}>
                +
              </button>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {readOnly ? null : (
        <div className="flex items-center gap-3 py-2 justify-self-end pr-2">
          <button
            onClick={() => onMoveUp(index)}
            className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-2xl transition"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(index)}
            className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-2xl transition"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => onDelete(index)}
            className="w-28 px-4 py-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-lg font-medium transition"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
