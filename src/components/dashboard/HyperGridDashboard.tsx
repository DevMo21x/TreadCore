'use client';

import { useMemo } from 'react';
import { useMetricsStore, useTreadmillStore } from '@/stores';
import PostWorkoutChart from './PostWorkoutChart';

function buildSegmentFills(value: number, maxValue: number, segments: number): number[] {
  if (maxValue <= 0 || segments <= 0) {
    return [];
  }

  const normalized = (Math.max(0, Math.min(value, maxValue)) / maxValue) * segments;

  return Array.from({ length: segments }, (_, index) =>
    Math.max(0, Math.min(1, normalized - index))
  );
}

function buildSparklinePath(
  values: readonly number[],
  maxValue: number,
  width: number = 100,
  height: number = 44
): string {
  const safeValues =
    values.length === 0 ? [0, 0] : values.length === 1 ? [values[0], values[0]] : values;
  const stepX = safeValues.length > 1 ? width / (safeValues.length - 1) : width;

  return safeValues
    .map((rawValue, index) => {
      const value = Math.max(0, Math.min(rawValue, maxValue));
      const x = index * stepX;
      const y = height - (value / Math.max(maxValue, 1)) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function SegmentedBar({
  value,
  maxValue,
  segments,
  fillClassName,
}: Readonly<{
  value: number;
  maxValue: number;
  segments: number;
  fillClassName: string;
}>) {
  return (
    <div className="mt-4 flex h-1 gap-1">
      {buildSegmentFills(value, maxValue, segments).map((fill, index) => (
        <div
          key={`${segments}-${index}`}
          className="relative h-full flex-1 overflow-hidden bg-[color:var(--hg-interactive-soft)]"
        >
          {fill > 0 ? (
            <div className={`h-full ${fillClassName}`} style={{ width: `${fill * 100}%` }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({
  label,
  values,
  stroke,
  glowClassName,
}: Readonly<{
  label: string;
  values: readonly number[];
  stroke: string;
  glowClassName?: string;
}>) {
  const path = buildSparklinePath(values, 10);

  return (
    <div className="glass-panel col-span-12 flex min-h-52 flex-col overflow-hidden rounded-xl border border-[color:var(--hg-border-soft)] p-4 lg:col-span-6 lg:h-full lg:min-h-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold tracking-widest text-[color:var(--hg-muted)]">
          {label}
        </span>
        <span className="text-[10px] font-bold tracking-widest text-[color:var(--hg-secondary)]">
          LIVE REPLAY
        </span>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-[color:var(--hg-border-subtle)] bg-[color:var(--hg-interactive-soft)] p-3">
        <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="block h-full w-full">
          <path d={path} fill="none" stroke={stroke} strokeWidth="2" className={glowClassName} />
        </svg>
      </div>
    </div>
  );
}

export default function HyperGridDashboard() {
  const speed = useTreadmillStore((state) => state.stableSpeed);
  const incline = useTreadmillStore((state) => state.stableIncline);
  const telemetry = useMetricsStore((state) => state.telemetry);
  const finalizedWorkoutId = useMetricsStore((state) => state.finalizedWorkoutId);

  // Snapshot telemetry once when a workout is finalized so the chart is stable
  const chartTelemetry = useMemo(
    () => telemetry.slice(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finalizedWorkoutId]
  );

  const speedHistory =
    telemetry.length > 0 ? telemetry.slice(-24).map((row) => row.speedKmh) : [speed, speed];
  const inclineHistory =
    telemetry.length > 0 ? telemetry.slice(-24).map((row) => row.inclinePct) : [incline, incline];

  if (finalizedWorkoutId !== null && chartTelemetry.length > 0) {
    return <PostWorkoutChart telemetry={chartTelemetry} />;
  }

  return (
    <div className="flex h-full flex-col gap-6 xl:grid xl:grid-rows-[16rem_minmax(0,1fr)] xl:gap-5 xl:overflow-hidden">
      <div className="grid grid-cols-12 gap-6 lg:h-64 xl:h-full">
        <div className="glass-panel col-span-12 flex flex-col justify-between overflow-hidden rounded-xl border-[rgba(189,244,255,0.5)] p-6 shadow-[inset_0_0_20px_rgba(0,227,253,0.1)] lg:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] font-bold tracking-widest text-[color:var(--hg-secondary)]">
              SPEED
            </span>
            <span className="pulse-indicator h-3 w-3 rounded-full bg-[color:var(--hg-secondary)] text-[color:var(--hg-secondary)]" />
          </div>

          <div className="mt-6 flex items-end gap-4">
            <span className="text-[clamp(4rem,10vw,5.25rem)] font-bold tracking-[-0.04em] text-[color:var(--hg-text)] text-shadow-neon-cyan">
              {speed.toFixed(1)}
            </span>
            <span className="mb-3 text-[12px] font-bold tracking-widest text-[color:var(--hg-muted)]">
              KM/H
            </span>
          </div>

          <SegmentedBar
            value={speed}
            maxValue={10}
            segments={4}
            fillClassName="bg-[var(--hg-secondary)] shadow-[0_0_8px_rgba(0,227,253,0.8)]"
          />
        </div>

        <div className="glass-panel col-span-12 flex flex-col justify-between overflow-hidden rounded-xl p-6 lg:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] font-bold tracking-widest text-[color:var(--hg-muted)]">
              INCLINE
            </span>
            <span
              className={`pulse-indicator h-3 w-3 rounded-full ${
                incline > 0
                  ? 'bg-[color:var(--hg-primary)] text-[color:var(--hg-primary)]'
                  : 'bg-[color:var(--hg-interactive-strong)] text-[color:var(--hg-disabled-text)]'
              }`}
            />
          </div>

          <div className="mt-6 flex items-end gap-4">
            <span className="text-[clamp(4rem,10vw,5.25rem)] font-bold tracking-[-0.04em] text-[color:var(--hg-text)] text-shadow-neon-violet">
              {incline.toFixed(1)}
            </span>
            <span className="mb-3 text-[12px] font-bold tracking-widest text-[color:var(--hg-muted)]">
              %
            </span>
          </div>

          <SegmentedBar
            value={incline}
            maxValue={10}
            segments={6}
            fillClassName="bg-[var(--hg-primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:min-h-52 xl:h-full xl:min-h-0">
        <HistoryPanel
          label="SPEED HISTORY"
          values={speedHistory}
          stroke="#bdf4ff"
          glowClassName="shadow-[0_0_8px_rgba(0,227,253,0.8)]"
        />
        <HistoryPanel
          label="INCLINE HISTORY"
          values={inclineHistory}
          stroke="#d0bcff"
          glowClassName="shadow-[0_0_8px_rgba(125,60,255,0.5)]"
        />
      </div>
    </div>
  );
}
