import { useRef } from 'react'
import type { Group, Object3D } from 'three'
import { useClockFrame } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import type { ConceptSpec } from '../../../scripts/conceptScaffold.mjs'
import { dotCount, sketchIndicators, unitFraction, type SketchIndicator } from './sketch'

const DEFAULT_DIAL = '#e9e5dc'
const DEFAULT_INK = ['#24262b', '#c9a96e', '#d8452f']

/** One primitive; `ref` receives the group the frame loop animates. */
function Primitive({
  indicator,
  color,
  groupRef,
}: {
  indicator: SketchIndicator
  color: string
  groupRef: (g: Group | null) => void
}) {
  const [inner, outer] = indicator.band
  const mid = (inner + outer) / 2
  const z = indicator.unit === 'hour' ? 2 : indicator.unit === 'minute' ? 3 : 4
  const ink = <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
  switch (indicator.kind) {
    case 'hand':
      return (
        <group ref={groupRef} name={indicator.unit}>
          <mesh position={[0, outer / 2, z]}>
            <boxGeometry args={[indicator.unit === 'second' ? 1 : 3, outer, 1]} />
            {ink}
          </mesh>
        </group>
      )
    case 'pair':
      return (
        <group ref={groupRef} name={indicator.unit}>
          {[0, 1].map((i) => (
            <group key={i}>
              <mesh position={[0, outer / 2, z]}>
                <boxGeometry args={[2, outer, 1]} />
                {ink}
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'ring':
      return (
        <group ref={groupRef} name={indicator.unit} position-z={z}>
          <mesh>
            <torusGeometry args={[1, 0.035, 8, 96]} />
            {ink}
          </mesh>
        </group>
      )
    case 'bead':
      return (
        <group position={[0, -mid, z]}>
          <mesh>
            <boxGeometry args={[outer * 1.6, 0.5, 0.3]} />
            <meshStandardMaterial color={color} transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <group ref={groupRef} name={indicator.unit}>
            <mesh>
              <sphereGeometry args={[3, 16, 12]} />
              {ink}
            </mesh>
          </group>
        </group>
      )
    case 'dots':
      return (
        <group ref={groupRef} name={indicator.unit}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * mid, Math.cos(a) * mid, z]}>
                <sphereGeometry args={[2.4, 12, 10]} />
                {ink}
              </mesh>
            )
          })}
        </group>
      )
  }
}

/**
 * A sketch of a concept spec, not the concept: each encoded unit is drawn with the primitive
 * its variable suggests, in its own band, so a spec's encoding can be seen running before
 * any concept code exists.
 */
export function SketchWatch({ spec }: { spec: ConceptSpec }) {
  const indicators = sketchIndicators(spec)
  const groups = useRef<Array<Group | null>>([])
  const dial = spec.appearance.find((f) => f.group === 'Dial')?.default ?? DEFAULT_DIAL
  const inks = spec.appearance.filter((f) => f.group === 'Indicators').map((f) => f.default)
  const colour = (i: number) => inks[i % inks.length] ?? DEFAULT_INK[i]

  useClockFrame((t) => {
    indicators.forEach((indicator, i) => {
      const g = groups.current[i]
      if (!g) return
      const f = unitFraction(indicator.unit, t)
      const [inner, outer] = indicator.band
      switch (indicator.kind) {
        case 'hand':
          g.rotation.z = dialRotationZ(f * 360)
          break
        case 'pair': {
          const half = f * 90
          const [a, b] = g.children as Object3D[]
          a.rotation.z = dialRotationZ(-half)
          b.rotation.z = dialRotationZ(half)
          break
        }
        case 'ring': {
          const r = inner + f * (outer - inner)
          g.scale.set(r, r, r)
          break
        }
        case 'bead':
          g.position.x = (f - 0.5) * outer * 1.6
          break
        case 'dots': {
          const n = dotCount(indicator.unit, t)
          g.children.forEach((dot, k) => (dot.visible = k < n))
          break
        }
      }
    })
  })

  return (
    <WatchCase caseColor="#c8cad0" caseRoughness={0.25} strapColor="#2a2420" strapStyle="leather">
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={dial} roughness={0.7} />
      </mesh>
      {indicators.map((indicator, i) => (
        <Primitive
          key={indicator.unit}
          indicator={indicator}
          color={colour(i)}
          groupRef={(g) => void (groups.current[i] = g)}
        />
      ))}
      <Crystal crystalTint="#e6eef5" crystalOpacity={0.08} />
    </WatchCase>
  )
}
