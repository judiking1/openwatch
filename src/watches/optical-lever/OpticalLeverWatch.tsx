import { useRef } from 'react'
import { AdditiveBlending, type Group } from 'three'
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
import { PrintLayer } from '../../three/parts/PrintLayer'
import { handAngles, type HandAngles } from '../../utils/time'
import type { OpticalLeverAppearance } from './appearance'
import { mirrorNormalAngle } from './optics'

type Kind = keyof HandAngles
const KINDS: Kind[] = ['hour', 'minute', 'second']

/** Beam length (where it lands), layer height and mirror size per laser. */
const LASERS: Record<Kind, { reach: number; z: number; mirror: number; width: number }> = {
  hour: { reach: 82, z: 2, mirror: 11, width: 1.8 },
  minute: { reach: 76, z: 3.8, mirror: 8.5, width: 1.4 },
  second: { reach: 56, z: 5.6, mirror: 6, width: 0.9 },
}
const EMITTER_Y = -88

/** Hour numerals, minute and seconds scales (white mask). */
function drawDial(ctx: CanvasRenderingContext2D) {
  const print = '#ffffff'
  drawLabels(ctx, HOUR_LABELS, { radius: 91, font: dialFont(600, 8), color: print })
  drawTicks(ctx, {
    count: 60,
    inner: 76,
    outer: 80,
    majorEvery: 5,
    majorInner: 74,
    width: 0.4,
    majorWidth: 0.9,
    color: print,
  })
  drawLabels(ctx, FIVE_MINUTE_LABELS, { radius: 68, font: dialFont(500, 5.5), color: print })
  drawTicks(ctx, {
    count: 60,
    inner: 56,
    outer: 58,
    majorEvery: 5,
    majorInner: 54,
    width: 0.3,
    majorWidth: 0.6,
    color: print,
    alpha: 0.7,
  })
}

/** Marks emitters for selective bloom (the stage's post effects; renderer-agnostic data). */
const GLOW = { glow: true }

/** A beam of light from the origin along local +y. */
function Beam({ length, width, color }: { length: number; width: number; color: string }) {
  return (
    <group>
      <mesh position={[0, length / 2, 0]} userData={GLOW}>
        <boxGeometry args={[width * 0.45, length, width * 0.45]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {[1.2, 3].map((scale, i) => (
        <mesh key={scale} position={[0, length / 2, 0]} userData={GLOW}>
          <boxGeometry args={[width * scale, length, width * scale]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={i === 0 ? 0.85 : 0.22}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Watch 009 — Optical Lever: reflected laser beams are the hands. */
export function OpticalLeverWatch({ appearance }: { appearance: OpticalLeverAppearance }) {
  const beams = useRef<Partial<Record<Kind, Group | null>>>({})
  const mirrors = useRef<Partial<Record<Kind, Group | null>>>({})
  const dial = useDialTexture(DIAL_RADIUS, drawDial, [])

  useClockFrame((t) => {
    const a = handAngles(t)
    for (const kind of KINDS) {
      const beam = beams.current[kind]
      const mirror = mirrors.current[kind]
      if (beam) beam.rotation.z = dialRotationZ(a[kind])
      if (mirror) mirror.rotation.z = dialRotationZ(mirrorNormalAngle(a[kind]))
    }
  })

  const color: Record<Kind, string> = {
    hour: appearance.hourBeam,
    minute: appearance.minuteBeam,
    second: appearance.secondBeam,
  }

  return (
    <WatchCase {...appearance}>
      <mesh receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.6} metalness={0.2} />
      </mesh>
      <PrintLayer mask={dial} color={appearance.printColor} radius={DIAL_RADIUS} roughness={0.6} />

      {/* emitter block at six o'clock */}
      <mesh position={[0, EMITTER_Y - 2, 3.5]}>
        <boxGeometry args={[10, 8, 6]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={0.9} roughness={0.3} />
      </mesh>

      {KINDS.map((kind) => {
        const l = LASERS[kind]
        return (
          <group key={kind} position={[0, 0, l.z]}>
            {/* incoming beam from the emitter to the mirror */}
            <group position={[0, EMITTER_Y, 0]}>
              <Beam length={-EMITTER_Y} width={l.width} color={color[kind]} />
            </group>
            {/* reflected beam: the hand */}
            <group ref={(g) => void (beams.current[kind] = g)} name={kind}>
              <Beam length={l.reach} width={l.width} color={color[kind]} />
              <mesh position={[0, l.reach, 0]} userData={GLOW}>
                <sphereGeometry args={[l.width * 1.6, 16, 12]} />
                <meshBasicMaterial color={color[kind]} toneMapped={false} />
              </mesh>
            </group>
            {/* the mirror: thin plate whose normal is local +y */}
            <group ref={(g) => void (mirrors.current[kind] = g)}>
              <mesh>
                <boxGeometry args={[l.mirror, 0.8, 1.4]} />
                <meshStandardMaterial color="#e8eef5" metalness={1} roughness={0.05} />
              </mesh>
            </group>
          </group>
        )
      })}

      <mesh position={[0, 0, 1]}>
        <cylinderGeometry args={[1.2, 1.2, 6, 16]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.3} />
      </mesh>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
