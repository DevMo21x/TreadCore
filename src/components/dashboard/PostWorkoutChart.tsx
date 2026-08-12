'use client';

import type { MetricRow } from '@/types';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

function formatSeconds(s: number): string {
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function downsample(rows: MetricRow[], maxPoints: number): MetricRow[] {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, i) => i % step === 0);
}

export default function PostWorkoutChart({ telemetry }: { telemetry: MetricRow[] }) {
  const data = downsample(telemetry, 600);
  const duration = telemetry.length > 0 ? telemetry[telemetry.length - 1].elapsedSeconds : 0;

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--hg-border-soft)] p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <span className="text-[12px] font-bold tracking-widest text-[color:var(--hg-muted)]">
          SESSION REPLAY
        </span>
        <span className="text-[10px] font-bold tracking-widest text-[color:var(--hg-secondary)]">
          {formatSeconds(duration)}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--hg-chart-grid)" strokeDasharray="" />
            <XAxis
              dataKey="elapsedSeconds"
              tickFormatter={formatSeconds}
              tick={{ fill: 'var(--hg-muted)', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="speed"
              orientation="left"
              domain={[0, 'auto']}
              tick={{ fill: 'var(--hg-secondary)', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <YAxis
              yAxisId="incline"
              orientation="right"
              domain={[0, 'auto']}
              tick={{ fill: 'var(--hg-primary)', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-tooltip-surface)] px-3 py-2 text-[11px] font-bold tracking-widest text-[color:var(--hg-text)] shadow-lg backdrop-blur-sm">
                    <div className="mb-1 text-[color:var(--hg-muted)]">
                      {formatSeconds(label as number)}
                    </div>
                    {payload.map((entry) => (
                      <div key={entry.name} style={{ color: entry.color as string }}>
                        {entry.name}: {(entry.value as number).toFixed(1)}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Line
              yAxisId="speed"
              type="monotone"
              dataKey="speedKmh"
              name="Speed km/h"
              stroke="var(--hg-secondary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--hg-secondary)' }}
            />
            <Line
              yAxisId="incline"
              type="monotone"
              dataKey="inclinePct"
              name="Incline %"
              stroke="var(--hg-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--hg-primary)' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
