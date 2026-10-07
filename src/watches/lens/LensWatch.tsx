import { useRef } from 'react'
import { Matrix4, Quaternion, Vector3, type Group, type InstancedMesh } from 'three'
import { useClockFrame } from '../../three/hooks'
import { useLabelMasks } from '../../three/labels'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { FIVE_MINUTE_LABELS, HOUR_LABELS } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialPoint3 } from '../../three/utils/dial'
import { degToRad, handAngles, jumpHourAngle } from '../../utils/time'
import type { LensAppearance } from './appearance'
import { lensScale } from './lens'

const HOURS = { radius: 44, size: 22 }
const MINUTE_LABELS = { radius: 70, size: 14 }
const BARS = { inner: 82, length: 2.6, width: 1.3 }
const DOTS = { radius: 20, size: 1.1 }
const Z_AXIS = new Vector3(0, 0, 1)
/** Fixed positions of the 60 bars and 60 dots, computed once. */
const BAR_POSITIONS = Array.from({ length: 60 }, (_, i) => dialPoint3(BARS.inner + 10, i * 6))
const DOT_POSITIONS = Array.from({ length: 60 }, (_, i) => dialPoint3(DOTS.radius, i * 6))
/** Reused every frame: no per-frame allocation for the 120 instances. */
const scratch = {
  matrix: new Matrix4(),
  position: new Vector3(),
  quaternion: new Quaternion(),
  scale: new Vector3(),
}

/** Watch 008 — Lens: the scale swells where the time is. */
export function LensWatch({ appearance }: { appearance: LensAppearance }) {
  const hours = useRef<Array<Group | null>>([])
  const minuteLabels = useRef<Array<Group | null>>([])
  const bars = useRef<InstancedMesh>(null)
  const dots = useRef<InstancedMesh>(null)

  const hourTextures = useLabelMasks(HOUR_LABELS, 700)
  const minuteTextures = useLabelMasks(FIVE_MINUTE_LABELS, 600)

  useClockFrame((t) => {
    const a = handAngles(t)
    const hourFocus = jumpHourAngle(t)
    hours.current.forEach((g, i) => g?.scale.setScalar(lensScale('hour', i * 30, hourFocus)))
    minuteLabels.current.forEach((g, i) =>
      g?.scale.setScalar(lensScale('minuteLabel', i * 30, a.minute)),
    )
    // 60 bars and 60 dots are two instanced meshes; matrices are written in place.
    const barMesh = bars.current
    if (barMesh) {
      for (let i = 0; i < 60; i++) {
        const angle = i * 6
        const swell = lensScale('minute', angle, a.minute)
        const [x, y] = BAR_POSITIONS[i]
        scratch.position.set(x, y, 0)
        scratch.quaternion.setFromAxisAngle(Z_AXIS, -degToRad(angle))
        scratch.scale.set(i % 5 === 0 ? 1.6 : 1, swell, swell)
        barMesh.setMatrixAt(
          i,
          scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale),
        )
      }
      barMesh.instanceMatrix.needsUpdate = true
    }
    const dotMesh = dots.current
    if (dotMesh) {
      for (let i = 0; i < 60; i++) {
        const [x, y] = DOT_POSITIONS[i]
        scratch.position.set(x, y, 0.6)
        scratch.quaternion.identity()
        scratch.scale.setScalar(lensScale('second', i * 6, a.second))
        dotMesh.setMatrixAt(
          i,
          scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale),
        )
      }
      dotMesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <WatchCase {...appearance}>
      <mesh receiveShadow>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.85} />
      </mesh>

      {HOUR_LABELS.map((_, i) => {
        const [x, y] = dialPoint3(HOURS.radius, i * 30)
        return (
          <group key={i} position={[x, y, 0.3]} ref={(g) => void (hours.current[i] = g)}>
            <mesh>
              <planeGeometry args={[HOURS.size, HOURS.size]} />
              <meshStandardMaterial
                map={hourTextures[i]}
                color={appearance.hourColor}
                transparent
                roughness={0.6}
              />
            </mesh>
          </group>
        )
      })}

      {FIVE_MINUTE_LABELS.map((_, i) => {
        const [x, y] = dialPoint3(MINUTE_LABELS.radius, i * 30)
        return (
          <group key={i} position={[x, y, 0.3]} ref={(g) => void (minuteLabels.current[i] = g)}>
            <mesh>
              <planeGeometry args={[MINUTE_LABELS.size, MINUTE_LABELS.size]} />
              <meshStandardMaterial
                map={minuteTextures[i]}
                color={appearance.minuteColor}
                transparent
                roughness={0.6}
              />
            </mesh>
          </group>
        )
      })}

      {/* minute bars grow inward and upward from the outer ring */}
      <instancedMesh ref={bars} args={[undefined, undefined, 60]} castShadow>
        <boxGeometry args={[BARS.width, BARS.length, 1]} />
        <meshStandardMaterial color={appearance.minuteColor} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={dots} args={[undefined, undefined, 60]}>
        <sphereGeometry args={[DOTS.size, 12, 8]} />
        <meshStandardMaterial color={appearance.secondColor} roughness={0.4} />
      </instancedMesh>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
