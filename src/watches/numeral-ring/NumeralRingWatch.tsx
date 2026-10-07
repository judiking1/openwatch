import { useRef } from 'react'
import type { Group } from 'three'
import { useClockFrame, useDialTexture } from '../../three/hooks'
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
import type { NumeralRingAppearance } from './appearance'
import { ringRotations } from './rings'

const HOUR_RING = { inner: 26, outer: 60, text: 46 }
const MINUTE_RING = { inner: 62, outer: 99, text: 82 }
const SECOND_DISC = { outer: 24, text: 15 }
const SECOND_LABELS = ['00', '10', '20', '30', '40', '50']
const WHITE = '#ffffff'

// Ring textures are drawn with extent = the ring's outer radius because RingGeometry
// UVs span the outer radius.

function drawHourRing(ctx: CanvasRenderingContext2D, color: string) {
  drawLabels(ctx, HOUR_LABELS, {
    radius: HOUR_RING.text,
    font: dialFont(600, 12),
    color,
    tangential: true,
  })
}

function drawMinuteRing(ctx: CanvasRenderingContext2D, color: string) {
  drawLabels(ctx, FIVE_MINUTE_LABELS, {
    radius: MINUTE_RING.text,
    font: dialFont(500, 9),
    color,
    tangential: true,
  })
  drawTicks(ctx, {
    count: 60,
    inner: MINUTE_RING.outer - 7,
    outer: MINUTE_RING.outer - 3,
    color,
    width: 0.6,
    skip: (i) => i % 5 === 0,
  })
}

function drawSecondDisc(ctx: CanvasRenderingContext2D, color: string) {
  drawLabels(ctx, SECOND_LABELS, {
    radius: SECOND_DISC.text,
    font: dialFont(600, 5),
    color,
    tangential: true,
  })
  drawTicks(ctx, {
    count: 60,
    inner: SECOND_DISC.outer - 2.5,
    outer: SECOND_DISC.outer - 0.8,
    majorEvery: 5,
    majorInner: SECOND_DISC.outer - 4,
    width: 0.4,
    majorWidth: 0.7,
    color,
    skip: (i) => i % 10 === 0,
  })
}

/** Watch 002 — Fixed Beam: numerals rotate under a fixed index. */
export function NumeralRingWatch({ appearance }: { appearance: NumeralRingAppearance }) {
  const hourRing = useRef<Group>(null)
  const minuteRing = useRef<Group>(null)
  const secondDisc = useRef<Group>(null)

  // White masks drawn once; colours are material tints.
  const hourTexture = useDialTexture(HOUR_RING.outer, (ctx) => drawHourRing(ctx, WHITE), [])
  const minuteTexture = useDialTexture(MINUTE_RING.outer, (ctx) => drawMinuteRing(ctx, WHITE), [])
  const secondTexture = useDialTexture(SECOND_DISC.outer, (ctx) => drawSecondDisc(ctx, WHITE), [])

  useClockFrame((t) => {
    const r = ringRotations(t)
    if (hourRing.current) hourRing.current.rotation.z = dialRotationZ(r.hour)
    if (minuteRing.current) minuteRing.current.rotation.z = dialRotationZ(r.minute)
    if (secondDisc.current) secondDisc.current.rotation.z = dialRotationZ(r.second)
  })

  return (
    <WatchCase {...appearance}>
      <mesh receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.8} />
      </mesh>

      <group ref={minuteRing} name="minute-ring" position={[0, 0, 0.6]}>
        <mesh>
          <ringGeometry args={[MINUTE_RING.inner, MINUTE_RING.outer, 128]} />
          <meshStandardMaterial
            map={minuteTexture}
            color={appearance.minuteRingColor}
            transparent
            roughness={0.6}
          />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.9]}>
        <torusGeometry args={[MINUTE_RING.inner - 1, 0.5, 8, 128]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.3} />
      </mesh>

      {/* hour ring, slightly raised */}
      <group ref={hourRing} name="hour-ring" position={[0, 0, 2]}>
        <mesh>
          <ringGeometry args={[HOUR_RING.inner, HOUR_RING.outer, 128]} />
          <meshStandardMaterial color={appearance.dialColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[HOUR_RING.inner, HOUR_RING.outer, 128]} />
          <meshStandardMaterial
            map={hourTexture}
            color={appearance.hourRingColor}
            transparent
            roughness={0.6}
          />
        </mesh>
      </group>

      <group ref={secondDisc} name="second-disc" position={[0, 0, 2.5]}>
        <mesh>
          <circleGeometry args={[SECOND_DISC.outer, 64]} />
          <meshStandardMaterial color={appearance.caseColor} metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <circleGeometry args={[SECOND_DISC.outer, 64]} />
          <meshStandardMaterial
            map={secondTexture}
            color={appearance.secondColor}
            transparent
            roughness={0.6}
          />
        </mesh>
      </group>

      {/* fixed luminous beam at twelve */}
      <mesh position={[0, 53, 4]}>
        <planeGeometry args={[13, 92]} />
        <meshBasicMaterial
          color={appearance.beamColor}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 6.8, 53, 4.2]}>
          <boxGeometry args={[0.6, 92, 0.6]} />
          <meshBasicMaterial color={appearance.beamColor} />
        </mesh>
      ))}

      <Crystal {...appearance} />
    </WatchCase>
  )
}
