import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { ExtrudeGeometry, Shape, type Group } from 'three'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { createDialTexture, dialRotationZ } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, dialPoint, handAngles } from '../../utils/time'
import type { OrbitalHandsAppearance } from './appearance'
import { defaultOrbitalHandsLayout, type IndicatorKind, type OrbitalHandsLayout } from './config'
import { indicatorOutline, indicatorSize, orbitRadius } from './geometry'

const KINDS: IndicatorKind[] = ['hour', 'minute', 'second']
const DIAL_RADIUS = 100

type Props = {
  appearance: OrbitalHandsAppearance
  layout?: OrbitalHandsLayout
}

function useDialTexture(layout: OrbitalHandsLayout, dial: string, numerals: string) {
  const texture = useMemo(
    () =>
      createDialTexture(DIAL_RADIUS, (ctx) => {
        ctx.fillStyle = dial
        ctx.fillRect(-DIAL_RADIUS, -DIAL_RADIUS, DIAL_RADIUS * 2, DIAL_RADIUS * 2)

        ctx.strokeStyle = numerals
        for (let i = 0; i < 60; i++) {
          const major = i % 5 === 0
          const r0 = layout.numeralRadius + 9
          const a = dialPoint(r0, i * 6)
          const b = dialPoint(r0 + (major ? 4 : 2), i * 6)
          ctx.globalAlpha = major ? 0.7 : 0.35
          ctx.lineWidth = major ? 0.9 : 0.5
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }

        ctx.globalAlpha = 1
        ctx.fillStyle = numerals
        ctx.font = '500 10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        for (let i = 0; i < 12; i++) {
          const p = dialPoint(layout.numeralRadius, i * 30)
          ctx.fillText(String(i === 0 ? 12 : i), p.x, p.y)
        }
      }),
    [layout.numeralRadius, dial, numerals],
  )
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function useIndicatorGeometry(layout: OrbitalHandsLayout, kind: IndicatorKind) {
  const geometry = useMemo(() => {
    const { length, width } = indicatorSize(layout, kind)
    // indicatorOutline is y-down; flip to the y-up scene.
    const pts = indicatorOutline(orbitRadius(layout, kind), length, width)
    const shape = new Shape()
    pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, -y) : shape.lineTo(x, -y)))
    shape.closePath()
    return new ExtrudeGeometry(shape, {
      depth: kind === 'second' ? 1.2 : 2,
      bevelEnabled: true,
      bevelSize: 0.3,
      bevelThickness: 0.3,
      bevelSegments: 2,
    })
  }, [layout, kind])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

function Indicator({
  kind,
  layout,
  color,
  z,
  groupRef,
}: {
  kind: IndicatorKind
  layout: OrbitalHandsLayout
  color: string
  z: number
  groupRef: (g: Group | null) => void
}) {
  const geometry = useIndicatorGeometry(layout, kind)
  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} position={[0, 0, z]} castShadow>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Watch 001 — Orbital Hands, procedural 3D model in dial units. */
export function OrbitalHandsWatch({ appearance, layout = defaultOrbitalHandsLayout }: Props) {
  const texture = useDialTexture(layout, appearance.dialColor, appearance.numeralColor)
  const groups = useRef<Partial<Record<IndicatorKind, Group | null>>>({})

  useFrame(() => {
    const angles = handAngles(clockTimeFromMs(useTimeStore.getState().now()))
    for (const kind of KINDS) {
      const g = groups.current[kind]
      if (g) g.rotation.z = dialRotationZ(angles[kind])
    }
  })

  const colors: Record<IndicatorKind, string> = {
    hour: appearance.hourColor,
    minute: appearance.minuteColor,
    second: appearance.secondColor,
  }

  return (
    <WatchCase {...appearance} radius={DIAL_RADIUS}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
      </mesh>

      {KINDS.map((kind) => (
        <mesh key={kind} position={[0, 0, 0.4]}>
          <torusGeometry args={[orbitRadius(layout, kind), 0.35, 8, 160]} />
          <meshStandardMaterial color={appearance.trackColor} metalness={0.8} roughness={0.4} />
        </mesh>
      ))}

      {KINDS.map((kind, i) => (
        <Indicator
          key={kind}
          kind={kind}
          layout={layout}
          color={colors[kind]}
          z={1 + i * 0.6}
          groupRef={(g) => {
            groups.current[kind] = g
          }}
        />
      ))}

      <mesh position={[0, 0, 0.2]}>
        <circleGeometry args={[2, 32]} />
        <meshStandardMaterial color={appearance.trackColor} metalness={0.8} roughness={0.3} />
      </mesh>

      <Crystal crystalTint={appearance.crystalTint} crystalOpacity={appearance.crystalOpacity} />
    </WatchCase>
  )
}
