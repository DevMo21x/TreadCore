'use client';
import React, { useMemo } from 'react';
import type { Segment } from '@/types/preset';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

type SegmentWithTimes = Segment & { start: number; end: number };

export default function SegmentTimeline({ segments }: { segments: Segment[] }) {
  const timeline = useMemo(() => {
    return segments.reduce((acc: SegmentWithTimes[], s) => {
      const start = acc.length ? acc[acc.length - 1].end : 0;
      const end = start + (s.duration_seconds || 0);
      acc.push({ ...(s as Segment), start, end });
      return acc;
    }, [] as SegmentWithTimes[]);
  }, [segments]);

  const total = useMemo(
    () => segments.reduce((a, b) => a + (b.duration_seconds || 0), 0),
    [segments]
  );

  const condensed = useMemo(() => {
    const out: SegmentWithTimes[] = [];
    for (const t of timeline) {
      const last = out[out.length - 1];
      if (last && last.name === t.name && last.speed === t.speed && last.incline === t.incline) {
        last.end = t.end;
      } else {
        out.push({ ...t });
      }
    }
    return out;
  }, [timeline]);

  return (
    <div>
      <div className="border rounded p-4">
        <h3 className="font-medium">Timeline Preview</h3>
        <div className="mt-3">
          <div className="w-full bg-gray-100 h-12 rounded overflow-hidden relative">
            {timeline.map((t, i) => {
              const pct = total ? ((t.end - t.start) / total) * 100 : 0;
              const startPct = total ? (t.start / total) * 100 : 0;
              const colors = [
                'from-blue-400 to-blue-600',
                'from-green-400 to-green-600',
                'from-yellow-400 to-yellow-600',
                'from-purple-400 to-purple-600',
                'from-pink-400 to-pink-600',
              ];
              const grad = colors[i % colors.length];
              const duration = t.end - t.start;
              return (
                <div
                  key={i}
                  title={`${t.name || `Segment ${i + 1}`} — ${formatTime(duration)}`}
                  style={{ left: `${startPct}%`, width: `${pct}%` }}
                  className={`absolute top-0 h-12 bg-gradient-to-r ${grad} text-white text-xs flex items-center justify-center border-r border-white/30`}
                >
                  <div className="px-2 truncate text-sm">
                    <div>
                      <strong className="mr-1">{t.name || `Segment ${i + 1}`}</strong>
                      <div className="text-xs opacity-90">{formatTime(duration)}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="absolute left-0 -bottom-6 text-xs text-gray-600">0:00</div>
            <div className="absolute right-0 -bottom-6 text-xs text-gray-600">
              {formatTime(total)}
            </div>

            <div className="absolute inset-x-0 -bottom-3 h-3">
              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                const left = `${Math.round(f * 100)}%`;
                const time = Math.round(total * f);
                return (
                  <div
                    key={String(f)}
                    style={{ left }}
                    className="absolute -translate-x-1/2 text-[10px] text-gray-500"
                  >
                    <div className="h-2 w-px bg-gray-400 mx-auto" />
                    <div className="mt-1">{formatTime(time)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <table className="w-full text-sm">
            <caption className="sr-only">Segment timeline and details</caption>
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="w-1/12">#</th>
                <th className="w-5/12">Segment</th>
                <th className="w-2/12">Duration</th>
                <th className="w-2/12">Starts At</th>
                <th className="w-2/12">Speed / Incline</th>
              </tr>
            </thead>
            <tbody>
              {condensed.map((t, i) => {
                const duration = t.end - t.start;
                const sp = t.speed || 3;
                const met = sp >= 8 ? 10 : sp >= 6 ? 8 : sp >= 4 ? 6 : 3.5;
                const cal = Math.round((duration / 60) * met * 70 * 0.0175);
                return (
                  <tr key={i} className="border-t">
                    <td className="py-2 text-gray-600">{i + 1}</td>
                    <td className="py-2">
                      <div>
                        <div className="font-medium">{t.name || `Segment ${i + 1}`}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(duration)} • {cal} kcal
                        </div>
                      </div>
                    </td>
                    <td className="py-2">{formatTime(duration)}</td>
                    <td className="py-2">{formatTime(t.start)}</td>
                    <td className="py-2 text-gray-700">
                      {t.speed} km/h • {t.incline}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
