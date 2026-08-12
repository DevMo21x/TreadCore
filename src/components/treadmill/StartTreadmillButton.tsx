'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { DEFAULT_START_SPEED, startSpeed } from '@/lib/treadmill/control';
import { useTreadmillStore } from '@/stores';

type StartTreadmillButtonProps = Readonly<{
  label?: string;
  loadingLabel?: string;
  className?: string;
  speed?: number;
  leadingIcon?: ReactNode;
}>;

function getStartButtonClassName({
  className,
  mqttConnected,
}: Readonly<{
  className?: string;
  mqttConnected: boolean;
}>): string {
  if (className) {
    return className;
  }

  return `flex h-20 w-full items-center justify-center rounded-xl border-2 bg-[rgba(47,248,1,0.1)] text-[#79ff5b] shadow-[0_0_20px_rgba(47,248,1,0.2)] transition-all hover:bg-[rgba(47,248,1,0.2)] hover:shadow-[0_0_30px_rgba(47,248,1,0.4)] disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] disabled:shadow-none ${
    !mqttConnected
      ? 'border-[color:var(--hg-border-soft)]'
      : 'border-[#79ff5b] shadow-[0_0_30px_rgba(47,248,1,0.3)]'
  }`;
}

export function StartTreadmillButton({
  label = 'Start Treadmill',
  loadingLabel = 'Starting Treadmill...',
  className,
  speed = DEFAULT_START_SPEED,
  leadingIcon,
}: StartTreadmillButtonProps) {
  const mqttConnected = useTreadmillStore((state) => state.mqttConnected);
  const currentSpeed = useTreadmillStore((state) => state.stableSpeed);
  const [loading, setLoading] = useState(false);
  const disabled = loading || !mqttConnected || currentSpeed > 0;
  const resolvedClassName = getStartButtonClassName({ className, mqttConnected });

  const handleStart = async () => {
    setLoading(true);

    try {
      await startSpeed(speed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleStart} disabled={disabled} className={resolvedClassName}>
      <span className="inline-flex items-center justify-center gap-2">
        {!loading && leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
        <span>{loading ? loadingLabel : label}</span>
      </span>
    </button>
  );
}
