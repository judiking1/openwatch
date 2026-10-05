import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { ShapeGeometry, type Group } from 'three'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { createDialTexture, dialRotationZ } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, dialPoint, handAngles } from '../../utils/time'
import type { EclipseAppearance } from './appearance'
import { apertureDiscShape, ECLIPSE } from './geometry'

const DIAL_RADIUS = 100

function drawLightFace(ctx: CanvasRenderingContext2D, glow: string, marker: string) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, DIAL_RADIUS)
  g.addColorStop(0, '#fff6e6')
  g.addColorStop(0.35, glow)
  g.addColorStop(1, glow)
  ctx.fillStyle = g
  ctx.fillRect(-DIAL_RADIUS, -DIAL_RADIUS, DIAL_RADIUS * 2, DIAL_RADIUS * 2)

  ctx.fillStyle = marker
  ctx.strokeStyle = marker
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 11px Inter, system-ui, sans-serif'
  for (let i = 0; i < 12; i++) {
    const p = dialPoint(ECLIPSE.hourDisc.apertureRadius, i * 30)
    ctx.fillText(String(i === 0 ? 12 : i), p.x, p.y)
  }
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0
    const r = ECLIPSE.minuteDisc.apertureRadius
    const a = dialPoint(r - (major ? 5 : 3), i * 6)
    const b = dialPoint(r + (major ? 5 : 3), i * 6)
    ctx.lineWidth = major ? 1.4 : 0.6
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function useApertureDisc(d: typeof ECLIPSE.hourDisc | typeof ECLIPSE.minuteDisc) {
  const geometry = useMemo(
    () =>
      new ShapeGeometry(apertureDiscShape(d.inner, d.outer, d.apertureRadius, d.apertureSize), 64),
    [d],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

/** Watch 003 — Eclipse: time read through apertures in rotating dark discs. */
export function EclipseWatch({ appearance }: { appearance: EclipseAppearance }) {
  const hourDisc = useRef<Group>(null)
  const minuteDisc = useRef<Group>(null)
  const moon = useRef<Group>(null)

  const { glowColor, markerColor } = appearance
  const face = useMemo(
    () => createDialTexture(DIAL_RADIUS, (ctx) => drawLightFace(ctx, glowColor, markerColor)),
    [glowColor, markerColor],
  )
  useEffect(() => () => face.dispose(), [face])

  const hourGeometry = useApertureDisc(ECLIPSE.hourDisc)
  const minuteGeometry = useApertureDisc(ECLIPSE.minuteDisc)

  useFrame(() => {
    const a = handAngles(clockTimeFromMs(useTimeStore.getState().now()))
    if (hourDisc.current) hourDisc.current.rotation.z = dialRotationZ(a.hour)
    if (minuteDisc.current) minuteDisc.current.rotation.z = dialRotationZ(a.minute)
    if (moon.current) moon.current.rotation.z = dialRotationZ(a.second)
  })

  const disc = (
    <meshStandardMaterial color={appearance.discColor} metalness={0.7} roughness={0.35} />
  )

  return (
    <WatchCase {...appearance} radius={DIAL_RADIUS}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial
          map={face}
          emissiveMap={face}
          emissive="#ffffff"
          emissiveIntensity={0.9}
          roughness={0.9}
        />
      </mesh>

      <group ref={minuteDisc} position={[0, 0, 1]}>
        <mesh geometry={minuteGeometry}>{disc}</mesh>
      </group>
      <group ref={hourDisc} position={[0, 0, 1.6]}>
        <mesh geometry={hourGeometry}>{disc}</mesh>
      </group>

      {/* sun (part of the glowing face) and orbiting moon for seconds */}
      <mesh position={[0, 0, 0.3]}>
        <circleGeometry args={[ECLIPSE.sun, 64]} />
        <meshStandardMaterial color="#fff6e6" emissive={glowColor} emissiveIntensity={1.4} />
      </mesh>
      <group ref={moon} position={[0, 0, 2.2]}>
        <mesh position={[0, ECLIPSE.moon.orbit, 0]}>
          <circleGeometry args={[ECLIPSE.moon.radius, 64]} />
          <meshStandardMaterial color={appearance.moonColor} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      <Crystal crystalTint={appearance.crystalTint} crystalOpacity={appearance.crystalOpacity} />
    </WatchCase>
  )
}
