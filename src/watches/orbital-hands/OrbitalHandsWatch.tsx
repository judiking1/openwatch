import { useRef } from 'react'
import { ExtrudeGeometry, MeshStandardMaterial, Shape, type Group } from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, drawLabels, drawTicks, fillDisc, HOUR_LABELS } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { handAngles } from '../../utils/time'
import type { OrbitalHandsAppearance } from './appearance'
import { defaultOrbitalHandsLayout, type IndicatorKind, type OrbitalHandsLayout } from './config'
import { indicatorOutline, indicatorSize, orbitRadius } from './geometry'

const KINDS: IndicatorKind[] = ['hour', 'minute', 'second']

type Props = {
  appearance: OrbitalHandsAppearance
  layout?: OrbitalHandsLayout
}

function drawDial(
  ctx: CanvasRenderingContext2D,
  layout: OrbitalHandsLayout,
  dial: string,
  numerals: string,
) {
  fillDisc(ctx, dial, DIAL_RADIUS)
  const r0 = layout.numeralRadius + 9
  drawTicks(ctx, {
    count: 60,
    inner: r0,
    outer: r0 + 2,
    majorOuter: r0 + 4,
    majorEvery: 5,
    color: numerals,
    alpha: 0.35,
    majorAlpha: 0.7,
    majorWidth: 0.9,
  })
  drawLabels(ctx, HOUR_LABELS, {
    radius: layout.numeralRadius,
    font: dialFont(500, 10),
    color: numerals,
  })
}

function indicatorGeometry(layout: OrbitalHandsLayout, kind: IndicatorKind) {
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
  const geometry = useDisposable(() => indicatorGeometry(layout, kind), [layout, kind])
  return (
    <group ref={groupRef} name={kind}>
      <mesh geometry={geometry} position={[0, 0, z]} castShadow>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Watch 001 — Orbital Hands, procedural 3D model in dial units. */
export function OrbitalHandsWatch({ appearance, layout = defaultOrbitalHandsLayout }: Props) {
  const { dialColor, numeralColor } = appearance
  const texture = useDialTexture(
    DIAL_RADIUS,
    (ctx) => drawDial(ctx, layout, dialColor, numeralColor),
    [layout, dialColor, numeralColor],
  )
  const groups = useRef<Partial<Record<IndicatorKind, Group | null>>>({})
  const track = useDisposable(
    () =>
      new MeshStandardMaterial({ color: appearance.trackColor, metalness: 0.8, roughness: 0.4 }),
    [appearance.trackColor],
  )

  useClockFrame((t) => {
    const angles = handAngles(t)
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
    <WatchCase {...appearance}>
      <mesh receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
      </mesh>

      {KINDS.map((kind) => (
        <mesh key={kind} position={[0, 0, 0.4]} material={track}>
          <torusGeometry args={[orbitRadius(layout, kind), 0.35, 8, 160]} />
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

      <mesh position={[0, 0, 0.2]} material={track}>
        <circleGeometry args={[2, 32]} />
      </mesh>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
