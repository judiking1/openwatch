import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Path, Shape, ShapeGeometry, type CanvasTexture, type Group } from 'three'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { createDialTexture, dialRotationZ } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, degToRad, dialPoint } from '../../utils/time'
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

const DIAL_RADIUS = 100
const WINDOW = { halfWidth: 13.5, inner: 18, outer: 98 }
/** Ring travel speed while re-aligning, degrees per second. */
const RING_SPEED = 220

type RingSpec = { group: CipherGroup; band: CipherBand; index: number }

const RINGS: RingSpec[] = CIPHER.flatMap((group) =>
  group.bands.map((band, index) => ({ group, band, index })),
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
  ctx.font = `700 ${group.fontSize}px Inter, system-ui, sans-serif`
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
  texture,
  color,
  groupRef,
}: {
  spec: RingSpec
  texture: CanvasTexture
  color: string
  groupRef: (g: Group | null) => void
}) {
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
  const angles = useRef<number[]>(RINGS.map(() => 0))

  const { glyphColor } = appearance
  const textures = useMemo(
    () =>
      RINGS.map((spec) =>
        createDialTexture(spec.band.outer, (ctx) => drawBand(ctx, spec, glyphColor), 1024),
      ),
    [glyphColor],
  )
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])
  const mask = useMemo(() => new ShapeGeometry(maskShape(), 96), [])
  useEffect(() => () => mask.dispose(), [mask])

  useFrame((_, dt) => {
    const values = cipherValues(clockTimeFromMs(useTimeStore.getState().now()))
    const step = RING_SPEED * Math.min(dt, 0.1)
    RINGS.forEach((spec, i) => {
      const target = ringTargets(spec.group, values[spec.group.id])[spec.index]
      const delta = shortestDelta(angles.current[i], target)
      angles.current[i] += Math.abs(delta) <= step ? delta : Math.sign(delta) * step
      const g = groups.current[i]
      if (g) g.rotation.z = dialRotationZ(angles.current[i])
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
    <WatchCase {...appearance} radius={DIAL_RADIUS}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.ringColor} roughness={0.8} />
      </mesh>

      {RINGS.map((spec, i) => (
        <Ring
          key={`${spec.group.id}-${spec.index}`}
          spec={spec}
          texture={textures[i]}
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

      <Crystal crystalTint={appearance.crystalTint} crystalOpacity={appearance.crystalOpacity} />
    </WatchCase>
  )
}
