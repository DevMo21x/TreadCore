'use client';

import React from 'react';
import { PresetRunnerProvider } from '@/context/PresetRunnerContext';
import { useWorkoutStore } from '@/stores';

export function PresetRunnerProviderWrapper({ children }: { children: React.ReactNode }) {
  const isPaused = useWorkoutStore((state) => state.status === 'paused');
  return <PresetRunnerProvider isPaused={isPaused}>{children}</PresetRunnerProvider>;
}

export default PresetRunnerProviderWrapper;
