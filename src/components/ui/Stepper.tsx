'use client';
import React, { useRef, useEffect } from 'react';

export default function Stepper({
  value,
  onChange,
  step = 1,
  min = -Infinity,
  max = Infinity,
  ariaLabel,
  formatValue,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  ariaLabel?: string;
  formatValue?: (v: number) => string | number;
}) {
  const timerRef = useRef<number | null>(null);

  function clamp(n: number) {
    return Math.min(max, Math.max(min, +n));
  }

  function change(delta: number) {
    const next = clamp(+(value + delta).toFixed(2));
    onChange(next);
  }

  function startRepeat(delta: number) {
    change(delta);
    // initial delay then repeat
    timerRef.current = window.setTimeout(function tick() {
      change(delta);
      timerRef.current = window.setTimeout(tick, 120);
    }, 300) as unknown as number;
  }

  function stopRepeat() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopRepeat();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`decrease ${ariaLabel ?? ''}`}
        onMouseDown={() => startRepeat(-step)}
        onTouchStart={() => startRepeat(-step)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchEnd={stopRepeat}
        className="w-11 h-11 rounded bg-gray-100 text-xl flex items-center justify-center"
      >
        −
      </button>

      <div className="min-w-[56px] text-center text-lg" aria-live="polite">
        {formatValue ? formatValue(value) : value}
      </div>

      <button
        type="button"
        aria-label={`increase ${ariaLabel ?? ''}`}
        onMouseDown={() => startRepeat(step)}
        onTouchStart={() => startRepeat(step)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchEnd={stopRepeat}
        className="w-11 h-11 rounded bg-gray-100 text-xl flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}
