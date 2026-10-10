import { PerformanceMonitor, PerspectiveCamera, View } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { ACESFilmicToneMapping, type PerspectiveCamera as Camera } from 'three'
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

/**
 * The viewer's default camera, narrowed to the part of the stage the stills are cropped to
 * (`scripts/capture-thumbnails.mjs`: 600 of 900 px), aimed at the watch centre — so a card
 * looks the same before and after its live view replaces the still.
 */
const CAMERA = { position: [0.5, -1.1, 7.9] as const, fov: 23.7 }
const aimAtCentre = (camera: Camera) => camera.lookAt(0, 0, 0)

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
        <PerspectiveCamera
          makeDefault
          position={CAMERA.position}
          fov={CAMERA.fov}
          near={0.05}
          far={50}
          onUpdate={aimAtCentre}
        />
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
 * Keeps the canvas over the visible part of the scroll area. The canvas lives inside the
 * scrolling content, so while the page scrolls (on the compositor, ahead of the next
 * frame) it moves with the cards instead of staying fixed and letting the views trail
 * behind; each frame, before the views render, it is moved back to the top of the visible
 * area (the scroller is the gallery's parent).
 */
function alignToScroller(frame: HTMLElement | null, offset: { current: number }) {
  const scroller = frame?.parentElement?.parentElement
  if (!frame || !scroller) return
  offset.current += scroller.getBoundingClientRect().top - frame.getBoundingClientRect().top
  frame.style.transform = `translate3d(0, ${offset.current}px, 0)`
}

type FrameRefs = { frame: RefObject<HTMLDivElement | null>; offset: RefObject<number> }

function FollowScroll({ frame, offset }: FrameRefs) {
  // Negative priority: runs before the views (priorities 1…n) draw.
  useFrame(() => alignToScroller(frame.current, offset), -1)
  return null
}

/**
 * One transparent canvas over the visible part of the gallery; every card's thumbnail is a
 * scissored view into it (drei <View>). One renderer for all watches, views scrolled out of
 * sight are skipped, and the resolution steps down when the frame rate drops.
 */
export function LiveLayer({ concepts, targets, renderer = 'webgl' }: Props) {
  const frame = useRef<HTMLDivElement>(null)
  const offset = useRef(0)
  // Aligned before the canvas first measures itself, so its size.top is the scroller's top.
  useLayoutEffect(() => alignToScroller(frame.current, offset), [])
  const [dpr, setDpr] = useState(DPR.high)
  const gl = useMemo(
    () => createWatchRenderer(renderer, { toneMapping: ACESFilmicToneMapping }),
    [renderer],
  )
  return (
    <div ref={frame} className="live-layer">
      <Canvas
        dpr={dpr}
        gl={gl}
        onCreated={(state) => bottomLeftViewports(state.gl)}
        eventSource={document.body}
        // Scrolling never resizes the canvas; it is re-aligned every frame instead.
        resize={{ scroll: false }}
        style={{ pointerEvents: 'none' }}
      >
        <FollowScroll frame={frame} offset={offset} />
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
    </div>
  )
}

export default LiveLayer
