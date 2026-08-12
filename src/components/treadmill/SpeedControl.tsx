'use client';

import { useState } from 'react';
import { commandSpeed, decreaseSpeed, increaseSpeed } from '@/lib/treadmill/control';
import { useTreadmillStore, useWorkoutStore } from '@/stores';
import { HyperGridControlPanel, type NumericQuickOption } from './HyperGridControlPanel';

// These are the preset speed options shown as quick buttons in the UI.
const HYPER_GRID_SPEED_QUICK_OPTIONS: ReadonlyArray<NumericQuickOption> = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
];

// This function finds the quick option value that is closest to the current speed.
// It helps highlight the most relevant quick button for the user.
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

/**
 * SpeedControl component provides the main speed control UI for the treadmill.
 *
 * It uses the useMaskedSpeed hook to ensure the speed display is smooth and user-friendly,
 * especially during pause and resume transitions. The component also provides quick buttons
 * for common speeds and handles increment/decrement actions.
 */
export function SpeedControl({
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
  const speed = useTreadmillStore((state) => state.stableSpeed);
  const mqttConnected = useTreadmillStore((state) => state.mqttConnected);
  const cooldownActive = useTreadmillStore((state) => state.cooldownActive);
  const setCooldownActive = useTreadmillStore((state) => state.setCooldownActive);
  const [loading, setLoading] = useState(false);
  const disabled = loading || !mqttConnected;
  const resolvedQuickOptions = quickOptions ?? HYPER_GRID_SPEED_QUICK_OPTIONS;

  async function runCommand(command: () => Promise<unknown>) {
    if (cooldownActive) {
      setCooldownActive(false);
    }
    setLoading(true);

    try {
      await command();
    } finally {
      setLoading(false);
    }
  }

  return (
    <HyperGridControlPanel
      accent="speed"
      className={className}
      label={label ?? 'SPEED'}
      value={speed}
      unit={unit ?? 'KM/H'}
      quickOptions={resolvedQuickOptions}
      activeOption={getNearestQuickOptionValue(speed, resolvedQuickOptions)}
      quickOptionsLayout={quickOptionsLayout}
      disabled={disabled}
      formatValue={(value) => value.toFixed(1)}
      onIncrement={() => runCommand(increaseSpeed)}
      onDecrement={() => runCommand(decreaseSpeed)}
      onQuickOption={(nextSpeed) =>
        runCommand(async () => {
          if (nextSpeed === speed) {
            return;
          }

          await commandSpeed(nextSpeed);
        })
      }
    />
  );
}
