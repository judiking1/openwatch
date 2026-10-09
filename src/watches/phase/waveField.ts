import { DataTexture, LinearFilter, type Texture } from 'three'
import { HOUR_RING, HOUR_WAVE, MINUTE_RING, MINUTE_WAVE } from './phase'
import { aimWaves, createWaveSim, ringPeak, stepWave, writeCrests } from './wave'

export type WaveKind = 'hour' | 'minute'

/** Per field: grid size (CPU / compute), wavelength, focus ring, and warm-up seconds. */
export const WAVE_FIELDS = {
  hour: { n: 160, gpuN: 256, wavelength: HOUR_WAVE, ring: HOUR_RING, warm: 12 },
  minute: { n: 256, gpuN: 384, wavelength: MINUTE_WAVE, ring: MINUTE_RING, warm: 18 },
} as const

/** A simulated wave field drawn into a texture (crests, white on black). */
export type WaveField = {
  texture: Texture
  /** Aims the emitters at `focus`, runs `steps` simulation steps and redraws the texture. */
  advance(renderer: unknown, focus: { x: number; y: number }, steps: number): void
  dispose(): void
}

/** The wave equation on the CPU (`wave.ts`), uploaded as a `DataTexture`: any renderer. */
export function createCpuWaves(kind: WaveKind): WaveField {
  const spec = WAVE_FIELDS[kind]
  const sim = createWaveSim(spec.n, spec.wavelength)
  const pixels = new Uint8Array(spec.n * spec.n * 4)
  const texture = new DataTexture(pixels, spec.n, spec.n)
  texture.magFilter = texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return {
    texture,
    advance(_renderer, focus, steps) {
      aimWaves(sim, focus)
      for (let s = 0; s < steps; s++) stepWave(sim)
      writeCrests(sim, ringPeak(sim, spec.ring), spec.ring, pixels)
      texture.needsUpdate = true
    },
    dispose: () => texture.dispose(),
  }
}
