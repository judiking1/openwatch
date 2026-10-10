import { useThree } from '@react-three/fiber'
import { useAsyncDisposable } from '../../three/hooks'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs } from '../../utils/time'
import { platePose, random, scatterSand } from './sand'

/** Grains on the compute path: eight times the CPU count. */
export const GPU_GRAINS = 32_768
const SETTLE_STEPS = 180

/**
 * The compute-shader sand, loaded only on the WebGPU backend (null elsewhere and while it
 * loads). It is settled on the GPU to the current time before it is shown.
 */
export function useComputeSand(enabled: boolean, z: number) {
  const gl = useThree((s) => s.gl)
  return useAsyncDisposable(
    enabled
      ? () =>
          import('./sandCompute').then(({ createComputeSand }) => {
            const sand = createComputeSand(scatterSand(GPU_GRAINS, random(1787)), z, 0.4)
            const pose = platePose(clockTimeFromMs(useTimeStore.getState().now()))
            for (let i = 0; i < SETTLE_STEPS; i++) sand.step(gl, pose, 1 / 60, { x: 0, y: 0 })
            return sand
          })
      : null,
    [enabled, gl, z],
  )
}
