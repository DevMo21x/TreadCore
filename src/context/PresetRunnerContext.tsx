'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Preset, Segment } from '@/types/preset';
import { commandSpeed, commandIncline } from '@/lib/treadmill/control';
import { useTreadmillStore } from '@/stores/treadmillStore';

type PresetRunnerContextValue = {
  activePreset: Preset | null;
  currentSegmentIndex: number;
  segmentTimeRemaining: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  startPresetById: (id: number) => Promise<void>;
  startPreset: (preset: Preset) => void;
  cancelPreset: () => void; // cancels runner only, does not send treadmill commands
  stopAndZero: () => Promise<void>; // cancels runner and sends speed=0
};

const PresetRunnerContext = createContext<PresetRunnerContextValue | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
  /**
   * Whether the system is currently paused. Pass this from an external store
   * subscription (e.g. Zustand). Defaults to false.
   */
  isPaused?: boolean;
};

export function PresetRunnerProvider({ children, isPaused = false }: ProviderProps) {
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segmentTimeRemaining, setSegmentTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const segmentTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // cleanup intervals
      if (segmentTimerRef.current) window.clearInterval(segmentTimerRef.current);
    };
  }, []);

  async function beginSegment(preset: Preset, index: number) {
    const segments = preset.segments ?? [];
    if (!segments[index]) return finishPreset();

    const seg: Segment = segments[index];

    // Command incline
    try {
      await commandIncline(seg.incline);
    } catch (e) {
      console.error('PresetRunner: commandIncline failed', e);
    }

    // Command speed directly to target
    try {
      await commandSpeed(seg.speed);
    } catch (e) {
      console.error('PresetRunner: commandSpeed failed', e);
    }

    // Start the segment countdown timer immediately when transition begins
    setSegmentTimeRemaining(seg.duration_seconds);
    if (segmentTimerRef.current) {
      window.clearInterval(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }

    segmentTimerRef.current = window.setInterval(() => {
      if (isPausedRef.current) return; // freeze countdown while paused
      setSegmentTimeRemaining((prev) => {
        if (prev <= 1) {
          // move to next segment
          if (segmentTimerRef.current) {
            window.clearInterval(segmentTimerRef.current);
            segmentTimerRef.current = null;
          }
          const nextIndex = index + 1;
          setCurrentSegmentIndex(nextIndex);
          // small microtask to allow state updates before starting next
          setTimeout(() => {
            beginSegment(preset, nextIndex);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function finishPreset() {
    // clear everything and leave treadmill at its current speed (per spec)
    if (segmentTimerRef.current) {
      window.clearInterval(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    setIsRunning(false);
    setActivePreset(null);
    setCurrentSegmentIndex(0);
    setSegmentTimeRemaining(0);
  }

  async function startPreset(preset: Preset) {
    // cancel any running preset first
    cancelPreset();
    setActivePreset(preset);
    setCurrentSegmentIndex(0);
    setIsRunning(true);
    // begin first segment
    await beginSegment(preset, 0);
  }

  async function startPresetById(id: number) {
    // fetch the preset then start it
    try {
      const res = await fetch(`/api/presets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch preset');
      const payload = (await res.json()) as Preset;
      await startPreset(payload);
    } catch (e) {
      console.error('PresetRunner: startPresetById failed', e);
      throw e;
    }
  }

  function cancelPreset() {
    // stops the runner only; leaves treadmill at whatever speed it's currently at
    if (segmentTimerRef.current) {
      window.clearInterval(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    setIsRunning(false);
    setActivePreset(null);
    setCurrentSegmentIndex(0);
    setSegmentTimeRemaining(0);
  }

  async function stopAndZero() {
    cancelPreset();
    try {
      await commandSpeed(0);
    } catch (e) {
      console.error('PresetRunner: stopAndZero commandSpeed(0) failed', e);
    }
  }

  const value: PresetRunnerContextValue = {
    activePreset,
    currentSegmentIndex,
    segmentTimeRemaining,
    isRunning,
    isPaused,
    startPresetById,
    startPreset,
    cancelPreset,
    stopAndZero,
  };

  return <PresetRunnerContext.Provider value={value}>{children}</PresetRunnerContext.Provider>;
}

export function usePresetRunner() {
  const ctx = useContext(PresetRunnerContext);
  if (!ctx) throw new Error('usePresetRunner must be used within PresetRunnerProvider');
  return ctx;
}

export default PresetRunnerContext;
