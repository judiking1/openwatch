import { AdaptiveDpr, PerspectiveCamera, View } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, type RefObject } from 'react'
import { resolveAppearance, useAppearanceStore } from '../../stores/appearanceStore'
import { StudioLighting } from '../../three/lighting/StudioLighting'
import type { WatchConcept } from '../../types/watch'
import { DIAL_UNIT } from '../viewer/WatchStage'

type Props = {
  concepts: WatchConcept[]
  /** Thumbnail elements to draw into, by concept id. */
  targets: Record<string, RefObject<HTMLElement | null>>
}

function LiveWatch({ concept }: { concept: WatchConcept }) {
  const overrides = useAppearanceStore((s) => s.overrides[concept.metadata.id])
  const appearance = resolveAppearance(concept.defaultAppearance, overrides)
  const { Model } = concept
  return (
    <Suspense fallback={null}>
      {/* Background inside Suspense: the still thumbnail shows until the model is ready. */}
      <color attach="background" args={['#0e0f13']} />
      <PerspectiveCamera makeDefault position={[0.35, -0.8, 6.6]} fov={35} near={0.05} far={50} />
      <StudioLighting contactShadows={false} />
      <group scale={DIAL_UNIT}>
        <Model appearance={appearance} />
      </group>
    </Suspense>
  )
}

/**
 * One transparent canvas over the whole page; every card's thumbnail is a scissored view
 * into it (drei <View>). One WebGL context for all watches, and views scrolled out of
 * sight are skipped. AdaptiveDpr scales resolution when frame rate drops.
 */
export function LiveLayer({ concepts, targets }: Props) {
  return (
    <Canvas
      className="live-layer"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      eventSource={document.body}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    >
      <AdaptiveDpr pixelated />
      {concepts.map((concept, i) => {
        const track = targets[concept.metadata.id]
        return track ? (
          <View key={concept.metadata.id} track={track as RefObject<HTMLElement>} index={i + 1}>
            <LiveWatch concept={concept} />
          </View>
        ) : null
      })}
    </Canvas>
  )
}

export default LiveLayer
