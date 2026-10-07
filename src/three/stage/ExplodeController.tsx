import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Group, Object3D } from 'three'
import { useStageStore } from '../../stores/stageStore'
import { approach, explodeLift } from './explode'

type Exploded = Object3D & { userData: { explodeBaseZ?: number } }

/**
 * Exploded view: every frame, layers that take part (`explodeLift`) sit at their assembled
 * z plus `lift × progress`. The assembled z is remembered the first time a layer is seen.
 */
export function ExplodeController({ root }: { root: RefObject<Group | null> }) {
  const progress = useRef(0)
  useFrame((_, dt) => {
    const target = useStageStore.getState().explode
    const p = (progress.current = approach(progress.current, target, Math.min(dt, 0.1)))
    root.current?.traverse((object) => {
      const lift = explodeLift(object)
      if (lift === null) return
      const o = object as Exploded
      o.userData.explodeBaseZ ??= o.position.z
      o.position.z = o.userData.explodeBaseZ + lift * p
    })
  })
  return null
}
