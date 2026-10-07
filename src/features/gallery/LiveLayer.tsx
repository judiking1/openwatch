import { PerformanceMonitor, PerspectiveCamera, View } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { resolveAppearance, useAppearanceStore } from '../../stores/appearanceStore'
import { StudioLighting } from '../../three/lighting/StudioLighting'
import { bottomLeftViewports, createWatchRenderer } from '../../three/renderer'
import { StageBackground } from '../../three/StageBackground'
import type { WatchConcept } from '../../types/watch'
import type { RendererMode } from '../viewer/rendererMode'
import { DIAL_UNIT } from '../viewer/WatchStage'

type Track = RefObject<HTMLElement | null>

type Props = {
  concepts: WatchConcept[]
  /** Thumbnail elements to draw into, by concept id. */
  targets: Record<string, Track>
  renderer?: RendererMode
}

/** Device-pixel ratios the live layer steps between as the frame rate allows. */
const DPR = { high: 1.5, normal: 1, low: 0.75 }

/**
 * Compiles a view's shaders off the main path (`compileAsync`: parallel compile on WebGL,
 * async pipelines on WebGPU) before the view is shown, then hides the card's still image.
 * Until then the thumbnail stays, so a card never flashes an empty or half-built frame.
 */
function WarmUp({ track, onReady }: { track: Track; onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let live = true
    const element = track.current
    const compileAsync = (gl as { compileAsync?: (...args: unknown[]) => Promise<unknown> })
      .compileAsync
    Promise.resolve(compileAsync?.call(gl, scene, camera))
      .catch(() => {})
      .then(() => {
        if (!live) return
        element?.setAttribute('data-live', '')
        onReady()
      })
    return () => {
      live = false
      element?.removeAttribute('data-live')
    }
  }, [gl, scene, camera, track, onReady])
  return null
}

function LiveWatch({ concept, track }: { concept: WatchConcept; track: Track }) {
  const overrides = useAppearanceStore((s) => s.overrides[concept.metadata.id])
  const appearance = resolveAppearance(concept.defaultAppearance, overrides)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const { Model } = concept
  return (
    <View track={track as RefObject<HTMLElement>} visible={ready}>
      <Suspense fallback={null}>
        <StageBackground color="#0e0f13" />
        <PerspectiveCamera makeDefault position={[0.35, -0.8, 6.6]} fov={35} near={0.05} far={50} />
        <StudioLighting contactShadows={false} />
        <group scale={DIAL_UNIT}>
          <Model appearance={appearance} />
        </group>
        <WarmUp track={track} onReady={onReady} />
      </Suspense>
    </View>
  )
}

/**
 * One transparent canvas over the whole page; every card's thumbnail is a scissored view
 * into it (drei <View>). One renderer for all watches, views scrolled out of sight are
 * skipped, and the resolution steps down when the frame rate drops.
 */
export function LiveLayer({ concepts, targets, renderer = 'webgl' }: Props) {
  const [dpr, setDpr] = useState(DPR.high)
  const gl = useMemo(
    () => createWatchRenderer(renderer, { toneMapping: ACESFilmicToneMapping }),
    [renderer],
  )
  return (
    <Canvas
      className="live-layer"
      dpr={dpr}
      gl={gl}
      onCreated={(state) => bottomLeftViewports(state.gl)}
      eventSource={document.body}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    >
      <PerformanceMonitor
        onIncline={() => setDpr(DPR.high)}
        onDecline={() => setDpr(DPR.normal)}
        onFallback={() => setDpr(DPR.low)}
        flipflops={3}
      />
      {concepts.map((concept) => {
        const track = targets[concept.metadata.id]
        return track ? (
          <LiveWatch key={concept.metadata.id} concept={concept} track={track} />
        ) : null
      })}
    </Canvas>
  )
}

export default LiveLayer
