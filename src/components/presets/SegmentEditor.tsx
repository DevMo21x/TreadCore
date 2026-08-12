'use client';
import type { Segment } from '@/types/preset';
import Stepper from '../ui/Stepper';

export default function SegmentEditor(props: {
  segments: Segment[];
  onChange: (s: Segment[]) => void;
  editable?: boolean;
  errors?: Record<number, Record<string, string>> | null;
  showDurationInMinutes?: boolean;
}) {
  const { segments, onChange, editable = true, errors, showDurationInMinutes = false } = props;

  function generateSegmentName(seg: Segment) {
    const dur = seg.duration_seconds ?? 0;
    const mins = dur >= 60 ? `${Math.round(dur / 60)}m` : `${dur}s`;
    const sp = typeof seg.speed === 'number' ? seg.speed.toFixed(1) : '0.0';
    const inc = typeof seg.incline === 'number' ? seg.incline : null;
    return `${mins} at ${sp}km/h${inc && inc !== 0 ? ` on ${inc}% incline` : ''}`;
  }

  function addSegment() {
    onChange([...segments, { name: null, duration_seconds: 60, speed: 3, incline: 0 }]);
  }

  function moveUp(i: number) {
    if (i <= 0) return;
    const next = [...segments];
    const tmp = next[i - 1];
    next[i - 1] = next[i];
    next[i] = tmp;
    onChange(next);
  }

  function moveDown(i: number) {
    if (i >= segments.length - 1) return;
    const next = [...segments];
    const tmp = next[i + 1];
    next[i + 1] = next[i];
    next[i] = tmp;
    onChange(next);
  }

  function updateSegment(i: number, patch: Partial<Segment>) {
    const next = segments.map((seg, idx) => (idx === i ? { ...seg, ...patch } : seg));
    // regenerate name for the updated segment only, but keep existing name if present
    const updated = next.map((seg, idx) => {
      if (idx === i) return { ...seg, name: generateSegmentName(seg) };
      return seg;
    });
    onChange(updated);
  }

  function removeSegment(i: number) {
    onChange(segments.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mt-3 space-y-3">
      {segments.map((seg, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-1 text-gray-600 flex flex-col items-center">
            <div className="text-sm">{i + 1}</div>
            {editable ? (
              <div className="flex flex-col mt-1 gap-1">
                <button
                  aria-label={`Move segment ${i + 1} up`}
                  className="text-xs p-1 bg-gray-100 rounded"
                  type="button"
                  onClick={() => moveUp(i)}
                >
                  ▲
                </button>
                <button
                  aria-label={`Move segment ${i + 1} down`}
                  className="text-xs p-1 bg-gray-100 rounded"
                  type="button"
                  onClick={() => moveDown(i)}
                >
                  ▼
                </button>
              </div>
            ) : null}
          </div>

          <div className="col-span-4">
            <label htmlFor={`seg-name-${i}`} className="block text-xs text-gray-500">
              Name
            </label>
            <input
              id={`seg-name-${i}`}
              className="w-full border px-2 py-1 rounded"
              value={seg.name ?? generateSegmentName(seg)}
              placeholder="Segment name"
              disabled
            />
            {errors && errors[i] && errors[i].name ? (
              <div className="text-xs text-red-600 mt-1">{errors[i].name}</div>
            ) : null}
          </div>

          <div className="col-span-2">
            <label htmlFor={`seg-duration-${i}`} className="block text-xs text-gray-500">
              {showDurationInMinutes ? 'Duration (min)' : 'Duration (s)'}
            </label>
            <div>
              <Stepper
                value={
                  showDurationInMinutes
                    ? Number(((seg.duration_seconds || 0) / 60).toFixed(2))
                    : Number(seg.duration_seconds || 0)
                }
                step={showDurationInMinutes ? 0.5 : 1}
                min={showDurationInMinutes ? 0.5 : 1}
                max={showDurationInMinutes ? 120 : 7200}
                ariaLabel="duration"
                formatValue={(v) => (showDurationInMinutes ? v + 'm' : `${v}s`)}
                onChange={(v) =>
                  updateSegment(i, {
                    duration_seconds: showDurationInMinutes ? Math.round(v * 60) : Math.round(v),
                  })
                }
              />
            </div>
            {errors && errors[i] && errors[i].duration ? (
              <div className="text-xs text-red-600 mt-1">{errors[i].duration}</div>
            ) : null}
          </div>

          <div className="col-span-2">
            <label htmlFor={`seg-speed-${i}`} className="block text-xs text-gray-500">
              Speed
            </label>
            <div>
              <Stepper
                value={Number(seg.speed ?? 0)}
                step={0.5}
                min={0}
                max={7}
                ariaLabel="speed"
                formatValue={(v) => `${v} km/h`}
                onChange={(v) => updateSegment(i, { speed: Number(v) })}
              />
            </div>
            {errors && errors[i] && errors[i].speed ? (
              <div className="text-xs text-red-600 mt-1">{errors[i].speed}</div>
            ) : null}
          </div>

          <div className="col-span-2">
            <label htmlFor={`seg-incline-${i}`} className="block text-xs text-gray-500">
              Incline
            </label>
            <div>
              <Stepper
                value={Number(seg.incline ?? 0)}
                step={0.5}
                min={0}
                max={15}
                ariaLabel="incline"
                formatValue={(v) => `${v}%`}
                onChange={(v) => updateSegment(i, { incline: Number(v) })}
              />
            </div>
            {errors && errors[i] && errors[i].incline ? (
              <div className="text-xs text-red-600 mt-1">{errors[i].incline}</div>
            ) : null}
          </div>

          <div className="col-span-1 flex items-center">
            {editable ? (
              <button
                type="button"
                className="w-full px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => removeSegment(i)}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      ))}

      {editable ? (
        <div>
          <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addSegment}>
            Add Segment
          </button>
        </div>
      ) : null}
    </div>
  );
}
