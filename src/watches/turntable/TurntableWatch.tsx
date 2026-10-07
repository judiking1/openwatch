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
import { DIAL_RADIUS, dialPoint3, dialRotationZ } from '../../three/utils/dial'
import { useLabelMasks } from '../../three/labels'
import { PrintLayer } from '../../three/parts/PrintLayer'
import type { TurntableAppearance } from './appearance'
import { turntablePose } from './turntable'

const BEZEL = { inner: 100, outer: 115, numerals: 107.5 }
const CRADLE_RADIUS = 120
const MINUTE_LABEL_RADIUS = 75

/** Bezel hour numerals (white mask). */
function drawBezel(ctx: CanvasRenderingContext2D) {
  const numerals = '#ffffff'
  drawLabels(ctx, HOUR_LABELS, {
    radius: BEZEL.numerals,
    font: dialFont(700, 9),
    color: numerals,
    tangential: true,
  })
}

/** Minute ticks (white mask). */
function drawDial(ctx: CanvasRenderingContext2D) {
  const scale = '#ffffff'
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

  const bezel = useDialTexture(BEZEL.outer, drawBezel, [])
  const dial = useDialTexture(DIAL_RADIUS, drawDial, [])

  const labelMasks = useLabelMasks(FIVE_MINUTE_LABELS)
  const labels = useRef<Array<Group | null>>([])

  useClockFrame((t) => {
    const p = turntablePose(t)
    if (head.current) head.current.rotation.z = dialRotationZ(p.head)
    // The minute numerals ride on the turning dial but stay upright for the reader.
    for (const label of labels.current) if (label) label.rotation.z = -dialRotationZ(p.head)
    if (minute.current) minute.current.rotation.z = dialRotationZ(p.minute)
    if (second.current) second.current.rotation.z = dialRotationZ(p.second)
  })

  return (
    <group>
      <WatchCase {...appearance} headRef={head}>
        <mesh>
          <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
          <meshStandardMaterial color={appearance.dialColor} roughness={0.75} />
        </mesh>
        <PrintLayer
          mask={dial}
          color={appearance.scaleColor}
          radius={DIAL_RADIUS}
          roughness={0.75}
        />
        <mesh position={[0, 0, 10.6]}>
          <ringGeometry args={[BEZEL.inner, BEZEL.outer, 128]} />
          <meshStandardMaterial color={appearance.bezelColor} metalness={0.3} roughness={0.5} />
        </mesh>
        <PrintLayer
          mask={bezel}
          color={appearance.bezelNumeralColor}
          radius={BEZEL.outer}
          inner={BEZEL.inner}
          z={10.65}
          metalness={0.3}
          roughness={0.5}
        />
        {FIVE_MINUTE_LABELS.map((_, i) => {
          const [x, y] = dialPoint3(MINUTE_LABEL_RADIUS, i * 30)
          return (
            <group key={i} position={[x, y, 0.3]} ref={(g) => void (labels.current[i] = g)}>
              <mesh>
                <planeGeometry args={[12, 12]} />
                <meshStandardMaterial
                  map={labelMasks[i]}
                  color={appearance.scaleColor}
                  transparent
                  roughness={0.75}
                />
              </mesh>
            </group>
          )
        })}
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
