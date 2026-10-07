import { useRef } from 'react'
import { ExtrudeGeometry, Shape, type Group } from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, drawLabels, drawTicks, HOUR_LABELS } from '../../three/utils/canvas'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { dialPoint } from '../../utils/time'
import type { ShearsAppearance } from './appearance'
import { OPENING_PER_MINUTE, SECONDS_TRACK, shearsPose } from './shears'

const HOUR_NUMERALS = 90
const BLADE_LENGTH = 68
const SCALE = { tickInner: 72, tickOuter: 76, labels: 81, extent: 86 }

/** Hour numerals and quarter ticks (white mask). */
function drawDial(ctx: CanvasRenderingContext2D) {
  const numerals = '#ffffff'
  drawLabels(ctx, HOUR_LABELS, { radius: HOUR_NUMERALS, font: dialFont(600, 9), color: numerals })
  // Quarter-hour ticks between the numerals.
  drawTicks(ctx, {
    count: 48,
    inner: HOUR_NUMERALS - 1,
    outer: HOUR_NUMERALS + 1,
    color: numerals,
    skip: (i) => i % 4 === 0,
  })
}

/** Minute scale carried by the blade pair: value m sits at ±1.5·m° from the bisector. */
/** Minute scale and seconds track (white mask). */
function drawCarrier(ctx: CanvasRenderingContext2D) {
  const color = '#ffffff'
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 5.6px Inter, system-ui, sans-serif'
  const half = OPENING_PER_MINUTE / 2
  for (let m = 0; m <= 60; m++) {
    for (const side of m === 0 ? [1] : [-1, 1]) {
      const angle = side * m * half
      const major = m % 5 === 0
      const a = dialPoint(major ? SCALE.tickInner - 1.5 : SCALE.tickInner, angle)
      const b = dialPoint(SCALE.tickOuter, angle)
      ctx.lineWidth = major ? 0.55 : 0.3
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
      if (m % 10 === 0 && m > 0) {
        const p = dialPoint(SCALE.labels, angle)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((angle * Math.PI) / 180)
        ctx.fillText(String(m), 0, 0)
        ctx.restore()
      }
    }
  }
  // Seconds track along the handles (opposite the blades).
  ctx.strokeStyle = color
  ctx.lineWidth = 0.35
  ctx.beginPath()
  ctx.moveTo(0, SECONDS_TRACK.inner)
  ctx.lineTo(0, SECONDS_TRACK.outer)
  ctx.stroke()
  for (const s of [0, 15, 30, 45, 60]) {
    const y = SECONDS_TRACK.inner + ((SECONDS_TRACK.outer - SECONDS_TRACK.inner) * s) / 60
    ctx.lineWidth = s % 30 === 0 ? 0.5 : 0.3
    ctx.beginPath()
    ctx.moveTo(-1.6, y)
    ctx.lineTo(1.6, y)
    ctx.stroke()
  }
}

/** Gold hour tip on the bisector (white mask). */
function drawTip(ctx: CanvasRenderingContext2D) {
  // Hour tip on the bisector.
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(0, -(SCALE.extent - 0.3))
  ctx.lineTo(-2.6, -(SCALE.labels + 0.5))
  ctx.lineTo(-1.1, -(SCALE.labels + 0.5))
  ctx.lineTo(-1.1, -50)
  ctx.lineTo(1.1, -50)
  ctx.lineTo(1.1, -(SCALE.labels + 0.5))
  ctx.lineTo(2.6, -(SCALE.labels + 0.5))
  ctx.closePath()
  ctx.fill()
}

function bladeGeometry(): ExtrudeGeometry {
  // Drawn pointing +y from the pivot, shank and ring on −y.
  const s = new Shape()
  s.moveTo(0, BLADE_LENGTH)
  s.quadraticCurveTo(3.6, 30, 3.4, 6)
  s.lineTo(2.2, -26)
  s.lineTo(-2.2, -26)
  s.lineTo(-3, 6)
  s.quadraticCurveTo(-1.6, 40, 0, BLADE_LENGTH)
  return new ExtrudeGeometry(s, {
    depth: 1.1,
    bevelEnabled: true,
    bevelSize: 0.35,
    bevelThickness: 0.35,
    bevelSegments: 2,
    curveSegments: 16,
  })
}

function Blade({
  groupRef,
  z,
  color,
  geometry,
}: {
  groupRef: React.RefObject<Group | null>
  z: number
  color: string
  geometry: ExtrudeGeometry
}) {
  return (
    <group ref={groupRef} position={[0, 0, z]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -33, 0.5]}>
        <torusGeometry args={[7, 1.6, 12, 48]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** Watch 004 — Shears: hour by direction, minutes by opening angle. */
export function ShearsWatch({ appearance }: { appearance: ShearsAppearance }) {
  const carrier = useRef<Group>(null)
  const bladeA = useRef<Group>(null)
  const bladeB = useRef<Group>(null)
  const bead = useRef<Group>(null)

  const dial = useDialTexture(DIAL_RADIUS, drawDial, [])
  const carrierTexture = useDialTexture(SCALE.extent, drawCarrier, [])
  const tipTexture = useDialTexture(SCALE.extent, drawTip, [])
  const blade = useDisposable(() => bladeGeometry(), [])

  useClockFrame((t) => {
    const p = shearsPose(t)
    if (carrier.current) carrier.current.rotation.z = dialRotationZ(p.bisector)
    if (bladeA.current) bladeA.current.rotation.z = dialRotationZ(p.bladeA)
    if (bladeB.current) bladeB.current.rotation.z = dialRotationZ(p.bladeB)
    if (bead.current) bead.current.position.y = -p.secondRadius
  })

  return (
    <WatchCase {...appearance}>
      <mesh receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.85} />
      </mesh>
      <PrintLayer
        mask={dial}
        color={appearance.numeralColor}
        radius={DIAL_RADIUS}
        roughness={0.85}
      />

      <group ref={carrier} position={[0, 0, 0.4]}>
        <mesh>
          <circleGeometry args={[SCALE.extent, 128]} />
          <meshStandardMaterial
            map={carrierTexture}
            color={appearance.scaleColor}
            transparent
            depthWrite={false}
            roughness={0.7}
          />
        </mesh>
        <PrintLayer
          mask={tipTexture}
          color={appearance.hourTipColor}
          radius={SCALE.extent}
          z={0.05}
        />
        <group ref={bead} position={[0, -SECONDS_TRACK.inner, 6]}>
          <mesh>
            <sphereGeometry args={[2.2, 24, 16]} />
            <meshStandardMaterial color={appearance.secondColor} roughness={0.35} />
          </mesh>
        </group>
      </group>

      <Blade groupRef={bladeA} z={1.4} color={appearance.bladeColor} geometry={blade} />
      <Blade groupRef={bladeB} z={3} color={appearance.bladeColor} geometry={blade} />

      {/* pivot screw */}
      <mesh position={[0, 0, 5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 1.6, 32]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.2} />
      </mesh>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
