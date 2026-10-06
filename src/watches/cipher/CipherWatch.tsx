import { useRef } from 'react'
import { Path, Shape, ShapeGeometry, type Group } from 'three'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { dialFont } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { degToRad, dialPoint } from '../../utils/time'
import type { CipherAppearance } from './appearance'
import {
  CIPHER,
  cipherValues,
  ringTargets,
  shortestDelta,
  slotAngle,
  type CipherBand,
  type CipherGroup,
} from './cipher'

const WINDOW = { halfWidth: 13.5, inner: 18, outer: 98 }
/** Ring travel speed while re-aligning, degrees per second. */
const RING_SPEED = 220

type RingSpec = { group: CipherGroup; band: CipherBand; index: number }

const RINGS: RingSpec[] = CIPHER.flatMap((group) =>
  group.bands.map((band, index) => ({ group, band, index })),
)

/** TARGETS[ring][value]: the rotation that brings `value` into the window, precomputed. */
const TARGETS = RINGS.map((spec) =>
  spec.group.glyphs.map((_, value) => ringTargets(spec.group, value)[spec.index]),
)

function drawBand(ctx: CanvasRenderingContext2D, spec: RingSpec, glyph: string) {
  const { group, band, index } = spec
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, band.outer, 0, Math.PI * 2)
  ctx.arc(0, 0, band.inner, 0, Math.PI * 2, true)
  ctx.clip()
  ctx.fillStyle = glyph
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = dialFont(700, group.fontSize)
  group.permutations[index].forEach((value, slot) => {
    const angle = slotAngle(group, slot)
    const p = dialPoint(group.centre, angle)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(degToRad(angle))
    ctx.fillText(group.glyphs[value], 0, 0)
    ctx.restore()
  })
  ctx.restore()
}

function maskShape(): Shape {
  const s = new Shape().absarc(0, 0, DIAL_RADIUS, 0, Math.PI * 2, false) as Shape
  const w = WINDOW.halfWidth
  s.holes.push(
    new Path()
      .moveTo(-w, WINDOW.inner)
      .lineTo(-w, WINDOW.outer)
      .lineTo(w, WINDOW.outer)
      .lineTo(w, WINDOW.inner)
      .lineTo(-w, WINDOW.inner),
  )
  return s
}

function Ring({
  spec,
  glyphColor,
  color,
  groupRef,
}: {
  spec: RingSpec
  glyphColor: string
  color: string
  groupRef: (g: Group | null) => void
}) {
  const texture = useDialTexture(
    spec.band.outer,
    (ctx) => drawBand(ctx, spec, glyphColor),
    [spec, glyphColor],
    1024,
  )
  return (
    <group ref={groupRef} position={[0, 0, 0.5]}>
      <mesh>
        <ringGeometry args={[spec.band.inner, spec.band.outer, 128]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <ringGeometry args={[spec.band.inner, spec.band.outer, 128]} />
        <meshStandardMaterial map={texture} transparent roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Watch 006 — Cipher: numerals become legible only where nine rings line up. */
export function CipherWatch({ appearance }: { appearance: CipherAppearance }) {
  const groups = useRef<Array<Group | null>>([])
  // null until the first frame, which snaps straight to the current time.
  const angles = useRef<number[] | null>(null)

  const mask = useDisposable(() => new ShapeGeometry(maskShape(), 96), [])

  useClockFrame((t, dt) => {
    const values = cipherValues(t)
    // First frame: start every ring at its target (one allocation, ever).
    const current = (angles.current ??= RINGS.map((spec, i) => TARGETS[i][values[spec.group.id]]))
    const step = RING_SPEED * Math.min(dt, 0.25)
    RINGS.forEach((spec, i) => {
      const delta = shortestDelta(current[i], TARGETS[i][values[spec.group.id]])
      current[i] += Math.abs(delta) <= step ? delta : Math.sign(delta) * step
      const g = groups.current[i]
      if (g) g.rotation.z = dialRotationZ(current[i])
    })
  })

  const frame = (
    <meshStandardMaterial
      color={appearance.windowColor}
      emissive={appearance.windowColor}
      emissiveIntensity={0.4}
    />
  )
  const w = WINDOW.halfWidth

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.ringColor} roughness={0.8} />
      </mesh>

      {RINGS.map((spec, i) => (
        <Ring
          key={`${spec.group.id}-${spec.index}`}
          spec={spec}
          glyphColor={appearance.glyphColor}
          color={appearance.ringColor}
          groupRef={(g) => {
            groups.current[i] = g
          }}
        />
      ))}

      {/* dimming mask with the reading window at twelve */}
      <mesh geometry={mask} position={[0, 0, 2]}>
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={appearance.maskOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* window frame and separators between hour / tens / units */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (w + 0.6), (WINDOW.inner + WINDOW.outer) / 2, 2.4]}>
          <boxGeometry args={[1.2, WINDOW.outer - WINDOW.inner, 1]} />
          {frame}
        </mesh>
      ))}
      {[69, 43.75].map((y) => (
        <mesh key={y} position={[0, y, 2.4]}>
          <boxGeometry args={[w * 2, 0.6, 0.6]} />
          {frame}
        </mesh>
      ))}

      <Crystal {...appearance} />
    </WatchCase>
  )
}
