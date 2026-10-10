import { DIAL_RADIUS } from '../utils/dial'

export type TouchPoint = { x: number; y: number }

/** A helper: skipped by the blueprint view and GLB export. */
const HELPER = { helper: true }

/**
 * An invisible disc just under the crystal that reports where it is touched (or hovered
 * with a mouse), in dial units, to `onTouch`; null when the pointer leaves or a finger
 * lifts. Concepts keep the point in a ref and read it in their frame loop.
 */
export function TouchSurface({
  onTouch,
  z = 8.9,
  radius = DIAL_RADIUS,
}: {
  onTouch: (point: TouchPoint | null) => void
  z?: number
  radius?: number
}) {
  return (
    <mesh
      position-z={z}
      userData={HELPER}
      onPointerMove={(e) => {
        const p = e.object.worldToLocal(e.point.clone())
        onTouch({ x: p.x, y: p.y })
      }}
      onPointerOut={() => onTouch(null)}
      onPointerUp={(e) => e.pointerType === 'touch' && onTouch(null)}
    >
      <circleGeometry args={[radius, 64]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  )
}
