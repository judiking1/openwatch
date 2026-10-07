import { useRef } from 'react'
import { ShapeGeometry, type Group } from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import {
  dialFont,
  drawLabels,
  drawTicks,
  FIVE_MINUTE_LABELS,
  HOUR_LABELS,
} from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { handAngles, jumpHourAngle } from '../../utils/time'
import type { EclipseAppearance } from './appearance'
import { apertureDiscShape, circleHole, ECLIPSE, sectorHole } from './geometry'

/** Hot centre of the glowing face: white fading to transparent (mask). */
function drawGlow(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, DIAL_RADIUS * 0.45)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(-DIAL_RADIUS, -DIAL_RADIUS, DIAL_RADIUS * 2, DIAL_RADIUS * 2)
}

/** Hour numerals, minute and seconds scales printed on the face (white mask). */
function drawMarkers(ctx: CanvasRenderingContext2D) {
  const marker = '#ffffff'

  drawLabels(ctx, HOUR_LABELS, {
    radius: ECLIPSE.hourDisc.apertureRadius,
    font: dialFont(700, 11),
    color: marker,
  })
  const m = ECLIPSE.minuteScale
  drawTicks(ctx, {
    count: 60,
    inner: m.tickInner,
    outer: m.tickOuter,
    majorEvery: 5,
    majorInner: m.tickInner - 2,
    width: 0.6,
    majorWidth: 1.2,
    color: marker,
  })
  drawLabels(ctx, FIVE_MINUTE_LABELS, {
    radius: m.numeralRadius,
    font: dialFont(700, 7),
    color: marker,
  })
  // Seconds scale around the sun, read against the moon's direction.
  drawTicks(ctx, {
    count: 60,
    inner: 17,
    outer: 19,
    majorEvery: 5,
    majorInner: 15.5,
    width: 0.3,
    majorWidth: 0.6,
    color: marker,
  })
}

/** Watch 003 — Eclipse: time read through apertures in rotating dark discs. */
export function EclipseWatch({ appearance }: { appearance: EclipseAppearance }) {
  const hourDisc = useRef<Group>(null)
  const minuteDisc = useRef<Group>(null)
  const moon = useRef<Group>(null)

  const { glowColor } = appearance
  const glow = useDialTexture(DIAL_RADIUS, drawGlow, [], 512)
  const markers = useDialTexture(DIAL_RADIUS, drawMarkers, [])
  const hourGeometry = useDisposable(() => {
    const d = ECLIPSE.hourDisc
    const shape = apertureDiscShape(d.inner, d.outer, circleHole(d.apertureRadius, d.apertureSize))
    return new ShapeGeometry(shape, 64)
  }, [])
  const minuteGeometry = useDisposable(() => {
    const { inner, outer, window: w } = ECLIPSE.minuteDisc
    const shape = apertureDiscShape(inner, outer, sectorHole(w.inner, w.outer, w.halfAngle))
    return new ShapeGeometry(shape, 64)
  }, [])

  useClockFrame((t) => {
    const a = handAngles(t)
    // Jumping hour: the aperture frames one whole numeral for the full hour.
    if (hourDisc.current) hourDisc.current.rotation.z = dialRotationZ(jumpHourAngle(t))
    if (minuteDisc.current) minuteDisc.current.rotation.z = dialRotationZ(a.minute)
    if (moon.current) moon.current.rotation.z = dialRotationZ(a.second)
  })

  const disc = (
    <meshStandardMaterial color={appearance.discColor} metalness={0.7} roughness={0.35} />
  )

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.9}
          roughness={0.9}
        />
      </mesh>
      <PrintLayer mask={glow} color="#fff6e6" radius={DIAL_RADIUS} emissive={1} />
      <PrintLayer mask={markers} color={appearance.markerColor} radius={DIAL_RADIUS} z={0.1} />

      <group ref={minuteDisc} name="minute" position={[0, 0, 1]}>
        <mesh geometry={minuteGeometry}>{disc}</mesh>
        {/* index notch at the centre of the window */}
        <mesh
          position={[0, ECLIPSE.minuteDisc.window.inner - 2.2, 0.3]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <circleGeometry args={[2, 3]} />
          <meshBasicMaterial color={glowColor} />
        </mesh>
      </group>
      <group ref={hourDisc} name="hour" position={[0, 0, 1.6]}>
        <mesh geometry={hourGeometry}>{disc}</mesh>
      </group>

      {/* sun (part of the glowing face) and orbiting moon for seconds */}
      <mesh position={[0, 0, 0.3]}>
        <circleGeometry args={[ECLIPSE.sun, 64]} />
        <meshStandardMaterial color="#fff6e6" emissive={glowColor} emissiveIntensity={1.4} />
      </mesh>
      <group ref={moon} name="second" position={[0, 0, 2.2]}>
        <mesh position={[0, ECLIPSE.moon.orbit, 0]}>
          <circleGeometry args={[ECLIPSE.moon.radius, 64]} />
          <meshStandardMaterial color={appearance.moonColor} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
