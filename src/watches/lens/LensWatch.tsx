import { useRef } from 'react'
import { CanvasTexture, SRGBColorSpace, type Group, type Mesh } from 'three'
import { useClockFrame, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import {
  createLabelCanvas,
  dialFont,
  FIVE_MINUTE_LABELS,
  HOUR_LABELS,
} from '../../three/utils/canvas'
import { DIAL_RADIUS, dialPoint3 } from '../../three/utils/dial'
import { handAngles, jumpHourAngle } from '../../utils/time'
import type { LensAppearance } from './appearance'
import { lensScale } from './lens'

const HOURS = { radius: 44, size: 22 }
const MINUTE_LABELS = { radius: 70, size: 14 }
const BARS = { inner: 82, length: 2.6, width: 1.3 }
const DOTS = { radius: 20, size: 1.1 }

/** One texture per label, disposed together. */
function useLabelTextures(labels: string[], weight: number, color: string) {
  return useDisposable(() => {
    const textures = labels.map((text) => {
      const t = new CanvasTexture(createLabelCanvas(text, dialFont(weight, 64), color))
      t.colorSpace = SRGBColorSpace
      return t
    })
    return { textures, dispose: () => textures.forEach((t) => t.dispose()) }
  }, [labels, weight, color]).textures
}

/** Watch 008 — Lens: the scale swells where the time is. */
export function LensWatch({ appearance }: { appearance: LensAppearance }) {
  const hours = useRef<Array<Group | null>>([])
  const minuteLabels = useRef<Array<Group | null>>([])
  const bars = useRef<Array<Mesh | null>>([])
  const dots = useRef<Array<Mesh | null>>([])

  const hourTextures = useLabelTextures(HOUR_LABELS, 700, appearance.hourColor)
  const minuteTextures = useLabelTextures(FIVE_MINUTE_LABELS, 600, appearance.minuteColor)

  useClockFrame((t) => {
    const a = handAngles(t)
    const hourFocus = jumpHourAngle(t)
    hours.current.forEach((g, i) => g?.scale.setScalar(lensScale('hour', i * 30, hourFocus)))
    minuteLabels.current.forEach((g, i) =>
      g?.scale.setScalar(lensScale('minuteLabel', i * 30, a.minute)),
    )
    bars.current.forEach((m, i) => {
      if (!m) return
      const s = lensScale('minute', i * 6, a.minute)
      m.scale.set(1, s, s)
    })
    dots.current.forEach((m, i) => m?.scale.setScalar(lensScale('second', i * 6, a.second)))
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
              <meshStandardMaterial map={hourTextures[i]} transparent roughness={0.6} />
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
              <meshStandardMaterial map={minuteTextures[i]} transparent roughness={0.6} />
            </mesh>
          </group>
        )
      })}

      {/* minute bars grow inward and upward from the outer ring */}
      {Array.from({ length: 60 }, (_, i) => {
        const angle = i * 6
        const [x, y] = dialPoint3(BARS.inner + 10, angle)
        return (
          <group key={i} position={[x, y, 0]} rotation={[0, 0, -(angle * Math.PI) / 180]}>
            <mesh ref={(m) => void (bars.current[i] = m)} position={[0, 0, 0]} castShadow>
              <boxGeometry args={[i % 5 === 0 ? BARS.width * 1.6 : BARS.width, BARS.length, 1]} />
              <meshStandardMaterial color={appearance.minuteColor} roughness={0.4} />
            </mesh>
          </group>
        )
      })}

      {Array.from({ length: 60 }, (_, i) => {
        const [x, y] = dialPoint3(DOTS.radius, i * 6)
        return (
          <mesh key={i} position={[x, y, 0.6]} ref={(m) => void (dots.current[i] = m)}>
            <sphereGeometry args={[DOTS.size, 12, 8]} />
            <meshStandardMaterial color={appearance.secondColor} roughness={0.4} />
          </mesh>
        )
      })}

      <Crystal {...appearance} />
    </WatchCase>
  )
}
