import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

export type RenderSample = {
  fps: number
  /** Draw calls and triangles of one whole frame, including off-screen passes. */
  calls: number
  triangles: number
  geometries: number
  textures: number
}

declare global {
  interface Window {
    /** Latest render sample, for scripted measurements (`?stats`). */
    __owlStats?: RenderSample
  }
}

/**
 * Samples the renderer twice a second. Auto-reset is turned off so the counters cover a
 * full frame (shadow maps, contact shadows, fluid passes and the main render), then reset
 * once per frame here.
 */
export function RenderStatsProbe({ onSample }: { onSample: (s: RenderSample) => void }) {
  const get = useThree((s) => s.get)
  const acc = useRef({ time: 0, frames: 0 })

  useEffect(() => {
    get().gl.info.autoReset = false
    return () => {
      get().gl.info.autoReset = true
    }
  }, [get])

  useFrame(({ gl }, delta) => {
    const a = acc.current
    a.time += delta
    a.frames++
    if (a.time >= 0.5) {
      const sample: RenderSample = {
        fps: Math.round(a.frames / a.time),
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      }
      window.__owlStats = sample
      onSample(sample)
      a.time = 0
      a.frames = 0
    }
    gl.info.reset()
  }, -1000)
  return null
}
