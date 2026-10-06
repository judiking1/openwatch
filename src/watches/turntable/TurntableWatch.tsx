import { useRef } from 'react'
import type { Group } from 'three'
import { useClockFrame, useDialTexture } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import {
  dialFont,
  drawLabels,
  drawTicks,
  fillDisc,
  FIVE_MINUTE_LABELS,
  HOUR_LABELS,
} from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import type { TurntableAppearance } from './appearance'
import { turntablePose } from './turntable'

const BEZEL = { inner: 100, outer: 115, numerals: 107.5 }
const CRADLE_RADIUS = 120

function drawBezel(ctx: CanvasRenderingContext2D, bezel: string, numerals: string) {
  ctx.fillStyle = bezel
  ctx.beginPath()
  ctx.arc(0, 0, BEZEL.outer, 0, Math.PI * 2)
  ctx.arc(0, 0, BEZEL.inner, 0, Math.PI * 2, true)
  ctx.fill()
  drawLabels(ctx, HOUR_LABELS, {
    radius: BEZEL.numerals,
    font: dialFont(700, 9),
    color: numerals,
    tangential: true,
  })
}

function drawDial(ctx: CanvasRenderingContext2D, dial: string, scale: string) {
  fillDisc(ctx, dial, DIAL_RADIUS)
  drawTicks(ctx, {
    count: 60,
    inner: 88,
    outer: 94,
    majorEvery: 5,
    majorInner: 84,
    width: 0.5,
    majorWidth: 1.2,
    color: scale,
  })
  drawLabels(ctx, FIVE_MINUTE_LABELS, { radius: 75, font: dialFont(600, 8), color: scale })
}

function Hand({
  groupRef,
  length,
  width,
  tail,
  z,
  color,
}: {
  groupRef: React.RefObject<Group | null>
  length: number
  width: number
  tail: number
  z: number
  color: string
}) {
  return (
    <group ref={groupRef} position={[0, 0, z]}>
      <mesh position={[0, (length - tail) / 2, 0]}>
        <boxGeometry args={[width, length + tail, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** Watch 005 — Turntable: the whole head turns on the strap and is the hour hand. */
export function TurntableWatch({ appearance }: { appearance: TurntableAppearance }) {
  const head = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)

  const { bezelColor, bezelNumeralColor, dialColor, scaleColor } = appearance
  const bezel = useDialTexture(
    BEZEL.outer,
    (ctx) => drawBezel(ctx, bezelColor, bezelNumeralColor),
    [bezelColor, bezelNumeralColor],
  )
  const dial = useDialTexture(DIAL_RADIUS, (ctx) => drawDial(ctx, dialColor, scaleColor), [
    dialColor,
    scaleColor,
  ])

  useClockFrame((t) => {
    const p = turntablePose(t)
    if (head.current) head.current.rotation.z = dialRotationZ(p.head)
    if (minute.current) minute.current.rotation.z = dialRotationZ(p.minute)
    if (second.current) second.current.rotation.z = dialRotationZ(p.second)
  })

  return (
    <group>
      <WatchCase {...appearance} headRef={head}>
        <mesh>
          <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
          <meshStandardMaterial map={dial} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0, 10.6]}>
          <ringGeometry args={[BEZEL.inner, BEZEL.outer, 128]} />
          <meshStandardMaterial map={bezel} transparent metalness={0.3} roughness={0.5} />
        </mesh>
        <Hand
          groupRef={minute}
          length={86}
          width={3.2}
          tail={14}
          z={2}
          color={appearance.handColor}
        />
        <Hand
          groupRef={second}
          length={90}
          width={1}
          tail={18}
          z={3.2}
          color={appearance.secondColor}
        />
        <mesh position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 1.4, 32]} />
          <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.2} />
        </mesh>
        <Crystal {...appearance} />
      </WatchCase>

      {/* fixed cradle the head turns in, carried by the lugs */}
      <mesh position={[0, 0, -10]}>
        <torusGeometry args={[CRADLE_RADIUS, 3.2, 16, 128]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.3} />
      </mesh>
      {/* fixed hour index on the strap side at twelve */}
      <group position={[0, BEZEL.outer + 5, 11]}>
        <mesh position={[0, 0, 3]} rotation={[0, 0, -Math.PI / 2]}>
          <circleGeometry args={[7, 3]} />
          <meshStandardMaterial color={appearance.indexColor} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 7, -9]}>
          <boxGeometry args={[6, 12, 20]} />
          <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
