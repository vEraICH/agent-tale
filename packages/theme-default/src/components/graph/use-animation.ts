/**
 * useAnimation — rAF loop decoupled from simulation.
 *
 * Manages dirty flag, idle detection, and frame skipping.
 * The loop goes dormant when nothing changes and wakes up
 * when the camera moves, simulation ticks, or interaction happens.
 */

import { useRef, useCallback, useEffect } from 'react';

interface AnimationState {
  rafId: number;
  running: boolean;
  dirty: boolean;
  lastFrameTime: number;
}

/**
 * Returns { markDirty, getTime }
 * - markDirty(): wake up the loop if dormant
 * - getTime(): current animation time in seconds
 *
 * The onFrame callback receives (time: number) and is called
 * every frame while dirty, or at least once after markDirty().
 */
export function useAnimation(
  onFrame: (time: number) => boolean, // return true if still dirty
): { markDirty: () => void; getTime: () => number } {
  const stateRef = useRef<AnimationState>({
    rafId: 0,
    running: false,
    dirty: true,
    lastFrameTime: 0,
  });

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const startTimeRef = useRef(0);

  const loop = useCallback(() => {
    const state = stateRef.current;
    if (!state.running) return;

    const now = performance.now();
    if (startTimeRef.current === 0) startTimeRef.current = now;
    const time = (now - startTimeRef.current) / 1000;
    state.lastFrameTime = time;

    const stillDirty = onFrameRef.current(time);
    state.dirty = stillDirty;

    if (stillDirty) {
      state.rafId = requestAnimationFrame(loop);
    } else {
      // Go dormant — will restart on markDirty
      state.running = false;
    }
  }, []);

  const markDirty = useCallback(() => {
    const state = stateRef.current;
    state.dirty = true;
    if (!state.running) {
      state.running = true;
      state.rafId = requestAnimationFrame(loop);
    }
  }, [loop]);

  const getTime = useCallback(() => {
    if (startTimeRef.current === 0) return 0;
    return (performance.now() - startTimeRef.current) / 1000;
  }, []);

  // Start loop on mount, clean up on unmount
  useEffect(() => {
    stateRef.current.running = true;
    stateRef.current.rafId = requestAnimationFrame(loop);

    return () => {
      stateRef.current.running = false;
      cancelAnimationFrame(stateRef.current.rafId);
    };
  }, [loop]);

  return { markDirty, getTime };
}
