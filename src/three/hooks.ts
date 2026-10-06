import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type DependencyList } from 'react'
import type { CanvasTexture } from 'three'
import { useTimeStore } from '../stores/timeStore'
import { clockTimeFromMs, type ClockTime } from '../utils/time'
import { createDialTexture } from './utils/dial'

/** Memoised three.js resource that is disposed when it changes or unmounts. */
export function useDisposable<T extends { dispose(): void }>(
  factory: () => T,
  deps: DependencyList,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's contract
  const value = useMemo(() => factory(), deps)
  useEffect(() => () => value.dispose(), [value])
  return value
}

/** Canvas texture drawn in dial units over a disc of radius `extent`. */
export function useDialTexture(
  extent: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  deps: DependencyList,
  size?: number,
): CanvasTexture {
  return useDisposable(() => createDialTexture(extent, draw, size), [extent, size, ...deps])
}

/**
 * Runs every frame with the displayed clock time (live, paused or simulated).
 * Concepts animate here so time control works for all of them without wiring.
 */
export function useClockFrame(update: (time: ClockTime, delta: number, epochMs: number) => void) {
  const latest = useRef(update)
  useEffect(() => {
    latest.current = update
  })
  useFrame((_, delta) => {
    const ms = useTimeStore.getState().now()
    latest.current(clockTimeFromMs(ms), delta, ms)
  })
}
