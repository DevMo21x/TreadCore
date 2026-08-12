'use client';

import { useState } from 'react';
import { commandIncline, decreaseIncline, increaseIncline } from '@/lib/treadmill/control';
import { useTreadmillStore } from '@/stores';
import { HyperGridControlPanel, type NumericQuickOption } from './HyperGridControlPanel';

const HYPER_GRID_INCLINE_QUICK_OPTIONS: ReadonlyArray<NumericQuickOption> = [
  { value: 0, label: '0' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
  { value: 8, label: '8' },
  { value: 10, label: '10' },
];

function getNearestQuickOptionValue(
  value: number,
  options: ReadonlyArray<NumericQuickOption<number>>
): number {
  return options.reduce(
    (closest, option) =>
      Math.abs(option.value - value) < Math.abs(closest - value) ? option.value : closest,
    options[0]?.value ?? value
  );
}

export function InclineControl({
  className,
  quickOptionsLayout,
  quickOptions,
  label,
  unit,
}: Readonly<{
  className?: string;
  quickOptionsLayout?: 'below' | 'left' | 'right';
  quickOptions?: ReadonlyArray<NumericQuickOption<number>>;
  label?: string;
  unit?: string;
}> = {}) {
  const incline = useTreadmillStore((state) => state.stableIncline);
  const mqttConnected = useTreadmillStore((state) => state.mqttConnected);
  const [loading, setLoading] = useState(false);
  const disabled = loading || !mqttConnected;
  const resolvedQuickOptions = quickOptions ?? HYPER_GRID_INCLINE_QUICK_OPTIONS;

  async function runCommand(command: () => Promise<unknown>) {
    setLoading(true);

    try {
      await command();
    } finally {
      setLoading(false);
    }
  }

  return (
    <HyperGridControlPanel
      accent="incline"
      className={className}
      label={label ?? 'INCLINE'}
      value={incline}
      unit={unit ?? 'GRADE %'}
      quickOptions={resolvedQuickOptions}
      activeOption={getNearestQuickOptionValue(incline, resolvedQuickOptions)}
      quickOptionsLayout={quickOptionsLayout}
      disabled={disabled}
      formatValue={(value) => value.toFixed(1)}
      onIncrement={() => runCommand(increaseIncline)}
      onDecrement={() => runCommand(decreaseIncline)}
      onQuickOption={(nextIncline) =>
        runCommand(async () => {
          if (nextIncline === incline) {
            return;
          }

          await commandIncline(nextIncline);
        })
      }
    />
  );
}
