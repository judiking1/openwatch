import { useRef } from 'react'
import { Quaternion, Vector3, type Group, type Texture } from 'three'
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
import { dialPoint3, dialRotationZ } from '../../three/utils/dial'
import { degToRad, handAngles } from '../../utils/time'
import type { MarbleAppearance } from './appearance'
import { advanceMarble, DISH_TILT, type MarbleState } from './marble'

const HOUR_DISH = { inner: 60, outer: 97, groove: 87, labels: 71, marble: 7, z: -9 }
const MINUTE_DISH = { outer: 56, groove: 45, labels: 32, marble: 4.6, z: -9.5 }
const CAVITY = 20

/** Quaternion that tilts a dish so the point at dial angle `low` goes down. */
function tiltTowards(low: number, tiltDeg: number, out: Quaternion) {
  const a = degToRad(low)
  // Axis = (low direction) × z, i.e. the in-plane perpendicular of the low direction.
  return out.setFromAxisAngle(new Vector3(Math.cos(a), -Math.sin(a), 0), -degToRad(tiltDeg))
}

function Dish({
  dishRef,
  marbleRef,
  ballRef,
  z,
  inner,
  outer,
  groove,
  marble,
  color,
  marbleColor,
  texture,
  printColor,
}: {
  dishRef: React.RefObject<Group | null>
  marbleRef: React.RefObject<Group | null>
  ballRef: React.RefObject<Group | null>
  z: number
  inner: number
  outer: number
  groove: number
  marble: number
  color: string
  marbleColor: string
  texture: Texture
  printColor: string
}) {
  return (
    <group position={[0, 0, z]}>
      <group ref={dishRef}>
        <mesh>
          {inner > 0 ? (
            <ringGeometry args={[inner, outer, 128]} />
          ) : (
            <circleGeometry args={[outer, 128]} />
          )}
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[Math.max(inner, 0.01), outer, 128]} />
          <meshStandardMaterial
            map={texture}
            color={printColor}
            transparent
            depthWrite={false}
            roughness={0.6}
          />
        </mesh>
        {/* rim lip and groove */}
        <mesh position={[0, 0, 0.6]}>
          <torusGeometry args={[outer, 0.9, 10, 128]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <torusGeometry args={[groove, marble * 0.55, 12, 160]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.12} roughness={0.9} />
        </mesh>
        <group ref={marbleRef}>
          <group position={[0, groove, marble * 0.8]}>
            <group ref={ballRef}>
              <mesh castShadow>
                <sphereGeometry args={[marble, 32, 24]} />
                <meshPhysicalMaterial
                  color={marbleColor}
                  roughness={0.08}
                  metalness={0.1}
                  clearcoat={1}
                  clearcoatRoughness={0.05}
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/** Watch 007 — Marble: dishes tilt toward the time, marbles roll there under gravity. */
export function MarbleWatch({ appearance }: { appearance: MarbleAppearance }) {
  const hourDish = useRef<Group>(null)
  const minuteDish = useRef<Group>(null)
  const hourMarble = useRef<Group>(null)
  const minuteMarble = useRef<Group>(null)
  const hourBall = useRef<Group>(null)
  const minuteBall = useRef<Group>(null)
  const states = useRef<{ hour: MarbleState; minute: MarbleState } | null>(null)
  const q = useRef(new Quaternion())

  // White masks drawn once; the print colour is a material tint.
  const printColor = '#ffffff'
  const hourTexture = useDialTexture(
    HOUR_DISH.outer,
    (ctx) => {
      drawLabels(ctx, HOUR_LABELS, {
        radius: HOUR_DISH.labels,
        font: dialFont(600, 10),
        color: printColor,
      })
      drawTicks(ctx, {
        count: 48,
        inner: HOUR_DISH.groove + 6,
        outer: HOUR_DISH.groove + 8.5,
        color: printColor,
        width: 0.5,
        majorEvery: 4,
        majorWidth: 1,
      })
    },
    [],
  )
  const minuteTexture = useDialTexture(
    MINUTE_DISH.outer,
    (ctx) => {
      drawLabels(ctx, FIVE_MINUTE_LABELS, {
        radius: MINUTE_DISH.labels,
        font: dialFont(600, 6.5),
        color: printColor,
      })
      drawTicks(ctx, {
        count: 60,
        inner: MINUTE_DISH.groove + 4.5,
        outer: MINUTE_DISH.groove + 6.5,
        color: printColor,
        width: 0.35,
        majorEvery: 5,
        majorWidth: 0.8,
      })
    },
    [],
  )

  useClockFrame((t, dt) => {
    const a = handAngles(t)
    const s = (states.current ??= {
      hour: { angle: a.hour, velocity: 0 },
      minute: { angle: a.minute, velocity: 0 },
    })
    const step = Math.min(dt, 0.1)
    s.hour = advanceMarble(s.hour, a.hour, step)
    s.minute = advanceMarble(s.minute, a.minute, step)

    if (hourDish.current)
      hourDish.current.quaternion.copy(tiltTowards(a.hour, DISH_TILT, q.current))
    if (minuteDish.current)
      minuteDish.current.quaternion.copy(tiltTowards(a.minute, DISH_TILT * 1.4, q.current))
    if (hourMarble.current) hourMarble.current.rotation.z = dialRotationZ(s.hour.angle)
    if (minuteMarble.current) minuteMarble.current.rotation.z = dialRotationZ(s.minute.angle)
    // Roll the balls: arc length travelled / ball radius, about the radial axis.
    if (hourBall.current)
      hourBall.current.rotation.x = (degToRad(s.hour.angle) * HOUR_DISH.groove) / HOUR_DISH.marble
    if (minuteBall.current)
      minuteBall.current.rotation.x =
        (degToRad(s.minute.angle) * MINUTE_DISH.groove) / MINUTE_DISH.marble
  })

  return (
    <WatchCase {...appearance} cavityDepth={CAVITY}>
      <Dish
        dishRef={hourDish}
        marbleRef={hourMarble}
        ballRef={hourBall}
        z={HOUR_DISH.z}
        inner={HOUR_DISH.inner}
        outer={HOUR_DISH.outer}
        groove={HOUR_DISH.groove}
        marble={HOUR_DISH.marble}
        color={appearance.dishColor}
        marbleColor={appearance.hourMarbleColor}
        texture={hourTexture}
        printColor={appearance.printColor}
      />
      <Dish
        dishRef={minuteDish}
        marbleRef={minuteMarble}
        ballRef={minuteBall}
        z={MINUTE_DISH.z}
        inner={0}
        outer={MINUTE_DISH.outer}
        groove={MINUTE_DISH.groove}
        marble={MINUTE_DISH.marble}
        color={appearance.innerDishColor}
        marbleColor={appearance.minuteMarbleColor}
        texture={minuteTexture}
        printColor={appearance.printColor}
      />
      {/* gimbal pivots */}
      {[0, 180].map((angle) => {
        const [x, y] = dialPoint3(HOUR_DISH.outer + 1.5, angle + 90)
        return (
          <mesh key={angle} position={[x, y, HOUR_DISH.z + 0.5]}>
            <sphereGeometry args={[1.6, 16, 12]} />
            <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.25} />
          </mesh>
        )
      })}
      <mesh position={[0, 0, MINUTE_DISH.z + 1.5]}>
        <cylinderGeometry args={[2.2, 2.2, 3, 24]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.25} />
      </mesh>
      <Crystal {...appearance} />
    </WatchCase>
  )
}
