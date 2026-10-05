import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { createDialTexture, dialRotationZ } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, degToRad, dialPoint } from '../../utils/time'
import type { TurntableAppearance } from './appearance'
import { turntablePose } from './turntable'

const DIAL_RADIUS = 100
const BEZEL = { inner: 100, outer: 115, numerals: 107.5 }
const CRADLE_RADIUS = 120

function drawBezel(ctx: CanvasRenderingContext2D, bezel: string, numerals: string) {
  ctx.fillStyle = bezel
  ctx.beginPath()
  ctx.arc(0, 0, BEZEL.outer, 0, Math.PI * 2)
  ctx.arc(0, 0, BEZEL.inner, 0, Math.PI * 2, true)
  ctx.fill()
  ctx.fillStyle = numerals
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 9px Inter, system-ui, sans-serif'
  for (let i = 0; i < 12; i++) {
    const p = dialPoint(BEZEL.numerals, i * 30)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(degToRad(i * 30))
    ctx.fillText(String(i === 0 ? 12 : i), 0, 0)
    ctx.restore()
  }
}

function drawDial(ctx: CanvasRenderingContext2D, dial: string, scale: string) {
  ctx.fillStyle = dial
  ctx.fillRect(-DIAL_RADIUS, -DIAL_RADIUS, DIAL_RADIUS * 2, DIAL_RADIUS * 2)
  ctx.strokeStyle = scale
  ctx.fillStyle = scale
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 8px Inter, system-ui, sans-serif'
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0
    const a = dialPoint(major ? 84 : 88, i * 6)
    const b = dialPoint(94, i * 6)
    ctx.lineWidth = major ? 1.2 : 0.5
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    if (major) {
      const p = dialPoint(75, i * 6)
      ctx.fillText(String(i).padStart(2, '0'), p.x, p.y)
    }
  }
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
  const bezel = useMemo(
    () => createDialTexture(BEZEL.outer, (ctx) => drawBezel(ctx, bezelColor, bezelNumeralColor)),
    [bezelColor, bezelNumeralColor],
  )
  const dial = useMemo(
    () => createDialTexture(DIAL_RADIUS, (ctx) => drawDial(ctx, dialColor, scaleColor)),
    [dialColor, scaleColor],
  )
  useEffect(() => () => bezel.dispose(), [bezel])
  useEffect(() => () => dial.dispose(), [dial])

  useFrame(() => {
    const p = turntablePose(clockTimeFromMs(useTimeStore.getState().now()))
    if (head.current) head.current.rotation.z = dialRotationZ(p.head)
    if (minute.current) minute.current.rotation.z = dialRotationZ(p.minute)
    if (second.current) second.current.rotation.z = dialRotationZ(p.second)
  })

  return (
    <group>
      <WatchCase {...appearance} radius={DIAL_RADIUS} headRef={head}>
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
        <Crystal crystalTint={appearance.crystalTint} crystalOpacity={appearance.crystalOpacity} />
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
