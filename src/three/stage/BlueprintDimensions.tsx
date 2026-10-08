import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three'
import { useStageStore } from '../../stores/stageStore'
import { useDisposable } from '../hooks'
import { DIAL_RADIUS } from '../utils/dial'
import { BLUEPRINT, formatMm } from './blueprint'

const CASE_RADIUS = DIAL_RADIUS + 14
const Z = 14

/** A dimension line with end ticks, as line-segment pairs (dial units). */
function dimension(x0: number, x1: number, y: number): number[] {
  const tick = 5
  return [
    [x0, y, Z, x1, y, Z],
    [x0, y - tick, Z, x0, y + tick, Z],
    [x1, y - tick, Z, x1, y + tick, Z],
  ].flat()
}

/**
 * Dimension callouts for the blueprint view: case and dial diameters on the shared case,
 * in millimetres at the drawing scale of `blueprint.ts` (a visual model, not a drawing for
 * manufacture). Rendered inside the model root, so in dial units.
 */
export function BlueprintDimensions() {
  const on = useStageStore((s) => s.blueprint)
  const material = useMemo(() => new LineBasicMaterial({ color: BLUEPRINT.dimension }), [])
  const geometry = useDisposable(() => {
    const g = new BufferGeometry()
    g.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          ...dimension(-CASE_RADIUS, CASE_RADIUS, -(CASE_RADIUS + 26)),
          ...dimension(-DIAL_RADIUS, DIAL_RADIUS, CASE_RADIUS + 26),
        ],
        3,
      ),
    )
    return g
  }, [])
  if (!on) return null
  return (
    <group name="blueprint-dimensions" userData={{ helper: true }}>
      <lineSegments geometry={geometry} material={material} userData={{ helper: true }} />
      <Html center position={[0, -(CASE_RADIUS + 38), Z]} className="blueprint-label">
        Case Ø {formatMm(CASE_RADIUS * 2)}
      </Html>
      <Html center position={[0, CASE_RADIUS + 38, Z]} className="blueprint-label">
        Dial Ø {formatMm(DIAL_RADIUS * 2)}
      </Html>
    </group>
  )
}
