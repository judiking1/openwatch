import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { createDialTexture, dialRotationZ } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, degToRad, dialPoint, handAngles } from '../../utils/time'
import type { NumeralRingAppearance } from './appearance'
import { ringRotations } from './rings'

const DIAL_RADIUS = 100
const HOUR_RING = { inner: 26, outer: 60, text: 46 }
const MINUTE_RING = { inner: 62, outer: 99, text: 82 }

/** Numerals drawn tangentially so the one at 12 o'clock reads upright. */
function drawRingLabels(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  radius: number,
  font: string,
  color: string,
) {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  labels.forEach((label, i) => {
    const angle = (360 / labels.length) * i
    const p = dialPoint(radius, angle)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(degToRad(angle))
    ctx.fillText(label, 0, 0)
    ctx.restore()
  })
}

function drawHourRing(ctx: CanvasRenderingContext2D, color: string) {
  const labels = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i))
  drawRingLabels(ctx, labels, HOUR_RING.text, '600 12px Inter, system-ui, sans-serif', color)
}

function drawMinuteRing(ctx: CanvasRenderingContext2D, color: string) {
  const labels = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
  drawRingLabels(ctx, labels, MINUTE_RING.text, '500 9px Inter, system-ui, sans-serif', color)
  ctx.strokeStyle = color
  ctx.lineWidth = 0.6
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue
    const a = dialPoint(MINUTE_RING.outer - 7, i * 6)
    const b = dialPoint(MINUTE_RING.outer - 3, i * 6)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

/** RingGeometry UVs span the ring's outer radius, so the texture extent must match it. */
function useRingTexture(
  draw: (ctx: CanvasRenderingContext2D, color: string) => void,
  color: string,
  extent: number,
) {
  const texture = useMemo(
    () => createDialTexture(extent, (ctx) => draw(ctx, color)),
    [draw, color, extent],
  )
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/** Watch 002 — Fixed Beam: numerals rotate under a fixed index. */
export function NumeralRingWatch({ appearance }: { appearance: NumeralRingAppearance }) {
  const hourRing = useRef<Group>(null)
  const minuteRing = useRef<Group>(null)
  const secondDisc = useRef<Group>(null)

  const hourTexture = useRingTexture(drawHourRing, appearance.hourRingColor, HOUR_RING.outer)
  const minuteTexture = useRingTexture(
    drawMinuteRing,
    appearance.minuteRingColor,
    MINUTE_RING.outer,
  )

  useFrame(() => {
    const r = ringRotations(handAngles(clockTimeFromMs(useTimeStore.getState().now())))
    if (hourRing.current) hourRing.current.rotation.z = dialRotationZ(r.hour)
    if (minuteRing.current) minuteRing.current.rotation.z = dialRotationZ(r.minute)
    if (secondDisc.current) secondDisc.current.rotation.z = dialRotationZ(r.second)
  })

  return (
    <WatchCase {...appearance} radius={DIAL_RADIUS}>
      <mesh receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.8} />
      </mesh>

      {/* minute ring */}
      <group ref={minuteRing} position={[0, 0, 0.6]}>
        <mesh>
          <ringGeometry args={[MINUTE_RING.inner, MINUTE_RING.outer, 128]} />
          <meshStandardMaterial map={minuteTexture} transparent roughness={0.6} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.9]}>
        <torusGeometry args={[MINUTE_RING.inner - 1, 0.5, 8, 128]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.3} />
      </mesh>

      {/* hour ring, slightly raised */}
      <group ref={hourRing} position={[0, 0, 2]}>
        <mesh>
          <ringGeometry args={[HOUR_RING.inner, HOUR_RING.outer, 128]} />
          <meshStandardMaterial color={appearance.dialColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[HOUR_RING.inner, HOUR_RING.outer, 128]} />
          <meshStandardMaterial map={hourTexture} transparent roughness={0.6} />
        </mesh>
      </group>

      {/* seconds disc */}
      <group ref={secondDisc} position={[0, 0, 2.5]}>
        <mesh>
          <circleGeometry args={[HOUR_RING.inner - 2, 64]} />
          <meshStandardMaterial color={appearance.caseColor} metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh position={[0, 16, 0.2]}>
          <circleGeometry args={[2.6, 32]} />
          <meshStandardMaterial color={appearance.secondColor} />
        </mesh>
      </group>

      {/* fixed luminous beam at twelve */}
      <mesh position={[0, 61, 4]}>
        <planeGeometry args={[13, 76]} />
        <meshBasicMaterial
          color={appearance.beamColor}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 6.8, 61, 4.2]}>
          <boxGeometry args={[0.6, 76, 0.6]} />
          <meshBasicMaterial color={appearance.beamColor} />
        </mesh>
      ))}

      <Crystal crystalTint={appearance.crystalTint} crystalOpacity={appearance.crystalOpacity} />
    </WatchCase>
  )
}
