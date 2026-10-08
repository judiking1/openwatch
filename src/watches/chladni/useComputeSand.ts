import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs } from '../../utils/time'
import { platePose, random, scatterSand } from './sand'

type ComputeSand = ReturnType<typeof import('./sandCompute').createComputeSand>

/** Grains on the compute path: eight times the CPU count. */
export const GPU_GRAINS = 32_768
const SETTLE_STEPS = 180

/**
 * The compute-shader sand, loaded only on the WebGPU backend (null elsewhere and while it
 * loads). It is settled on the GPU to the current time before it is shown.
 */
export function useComputeSand(enabled: boolean, z: number) {
  const gl = useThree((s) => s.gl)
  const [sand, setSand] = useState<ComputeSand | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    let made: ComputeSand | undefined
    void import('./sandCompute').then(({ createComputeSand }) => {
      if (!live) return
      made = createComputeSand(scatterSand(GPU_GRAINS, random(1787)), z, 0.4)
      const pose = platePose(clockTimeFromMs(useTimeStore.getState().now()))
      for (let i = 0; i < SETTLE_STEPS; i++) made.step(gl, pose, 1 / 60, { x: 0, y: 0 })
      setSand(made)
    })
    return () => {
      live = false
      made?.dispose()
      setSand(null)
    }
  }, [enabled, gl, z])
  return sand
}
