import { useMemo, useRef } from 'react'
import {
  BackSide,
  CanvasTexture,
  Matrix4,
  SphereGeometry,
  SRGBColorSpace,
  type Group,
  type InstancedMesh,
} from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { Lines } from '../../three/parts/Lines'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, drawLabels } from '../../three/utils/canvas'
import { countRaster, DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { PrintLayer } from '../../three/parts/PrintLayer'
import type { AngbuilguAppearance } from './appearance'
import {
  dayOfYear,
  declinationFromLongitude,
  nightWatch,
  poleVector,
  shadowOnSphere,
  SIJIN_HANJA,
  sijinRange,
  solarLongitude,
  sunVector,
  type Vec3,
} from './sky'

/** Bowl radius and how much its depth is flattened to fit a wrist. */
const R = 86
const SQUASH = 0.24
const NEEDLE = 40
const SHADOW_SAMPLES = 24
/** Dots of the reading guide from the shadow tip down to the hour numbers. */
const GUIDE_SAMPLES = 22
const SOLSTICE = 23.44
const FIRST_HOUR = 5
const LAST_HOUR = 19

type P3 = [number, number, number]

/** Reused by the per-frame shadow cast. */
const scratch = { q: { x: 0, y: 0, z: 0 }, p: { x: 0, y: 0, z: 0 } }

/** True-sphere point → flattened bowl coordinates, nudged slightly toward the centre. */
function toBowl(v: Vec3, inset = 0.995): P3 {
  return [v.x * inset, v.y * inset, v.z * inset * SQUASH]
}

/** Shadow-tip position on the sphere for a solar time and declination. */
function tipShadow(hours: number, declination: number): Vec3 | null {
  const sun = sunVector(hours, declination)
  if (sun.z <= 0.01) return null
  return shadowOnSphere({ x: 0, y: 0, z: 0 }, sun, R)
}

/** Line segments (pairs of points) for the engraved grid. */
function useGrid() {
  return useMemo(() => {
    const hourMajor: P3[] = []
    const hourMinor: P3[] = []
    const terms: P3[] = []
    const push = (list: P3[], a: Vec3 | null, b: Vec3 | null) => {
      if (a && b) list.push(toBowl(a), toBowl(b))
    }
    // Hour lines (meridians) every 15 minutes, spanning the solstices.
    for (let q = FIRST_HOUR * 4; q <= LAST_HOUR * 4; q++) {
      const hours = q / 4
      const list = q % 4 === 0 ? hourMajor : hourMinor
      for (let d = -SOLSTICE; d < SOLSTICE; d += 2) {
        push(list, tipShadow(hours, d), tipShadow(hours, Math.min(d + 2, SOLSTICE)))
      }
    }
    // 13 solar-term lines (constant declination), solstice to solstice.
    for (let k = 0; k <= 12; k++) {
      const d = declinationFromLongitude(-90 + k * 15)
      for (let h = FIRST_HOUR; h < LAST_HOUR; h += 0.1) {
        push(terms, tipShadow(h, d), tipShadow(h + 0.1, d))
      }
    }
    return { hourMajor, hourMinor, terms }
  }, [])
}

type Label = { text: string; position: P3; size: number; weight: number }

/**
 * Engraved labels. Readable without Hanja: large Arabic hours sit in the open lower bowl
 * where the hour lines are widest apart; each 시진 character carries its clock hours, and the
 * season lines their months.
 */
function useLabels(): Label[] {
  return useMemo(() => {
    const labels: Label[] = []
    const add = (text: string, p: Vec3 | null, size: number, weight = 700) => {
      if (p) labels.push({ text, position: toBowl(p, 0.97), size, weight })
    }
    // Hours just beyond the summer-solstice line.
    for (let h = FIRST_HOUR + 1; h <= LAST_HOUR - 1; h++) {
      add(String(h), tipShadow(h, SOLSTICE + 7), 9, 800)
    }
    // 시진 names at the middle of each double hour (卯 = 6 h … 酉 = 18 h), hours below.
    for (let h = 6; h <= 18; h += 2) {
      const index = ((h + 1) / 2) | 0
      add(SIJIN_HANJA[index % 12], tipShadow(h, -SOLSTICE - 10), 9)
      add(sijinRange(index % 12), tipShadow(h, -SOLSTICE - 3), 5.4, 700)
    }
    const termLabels: Array<[string, number]> = [
      ['冬至 12월', -SOLSTICE + 2],
      ['春秋分 3·9월', 2],
      ['夏至 6월', SOLSTICE - 2],
    ]
    // Between the 13 h and 14 h lines, just inside each season line.
    for (const [text, d] of termLabels) add(text, tipShadow(13.5, d), 5, 700)
    return labels
  }, [])
}

/** Text mask sized to its content (a white mask; the engraving colour is a material tint). */
function createLabelMask(text: string, weight: number) {
  const height = 64
  const font = dialFont(weight, 48)
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = font
  const width = Math.ceil(measure.measureText(text).width) + 16
  countRaster(Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  return canvas
}

/** A label with a bowl-coloured backing, so it stays legible over the engraved grid. */
function LabelPlane({ label, color, backing }: { label: Label; color: string; backing: string }) {
  const texture = useDisposable(() => {
    const t = new CanvasTexture(createLabelMask(label.text, label.weight))
    t.colorSpace = SRGBColorSpace
    return t
  }, [label.text, label.weight])
  const aspect = texture.image.width / texture.image.height
  const [x, y, z] = label.position
  const [w, h] = [label.size * aspect, label.size]
  return (
    <group position={[x, y, z + 0.4]}>
      <mesh position-z={-0.05}>
        <planeGeometry args={[w * 0.92, h * 0.8]} />
        <meshStandardMaterial color={backing} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} color={color} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Directions and night watches engraved on the rim (white mask). */
function drawRim(ctx: CanvasRenderingContext2D) {
  const text = '#ffffff'
  drawLabels(ctx, ['北', '東', '南', '西'], {
    radius: R + 7.5,
    font: dialFont(700, 7),
    color: text,
    tangential: true,
  })
  // Five night watches of two hours from 19:00, with their clock hours.
  const watches = ['初更 19–21', '二更 21–23', '三更 23–1', '四更 1–3', '五更 3–5']
  drawLabels(ctx, watches, {
    radius: R + 7.5,
    font: dialFont(600, 4.2),
    color: text,
    tangential: true,
    angleOf: (i) => -90 + 18 + i * 36 + (i === 2 ? 9 : 0),
  })
}

/** Watch 010 — Angbuilgu: a Joseon concave sundial with a virtual sun. */
export function AngbuilguWatch({ appearance }: { appearance: AngbuilguAppearance }) {
  const grid = useGrid()
  const labels = useLabels()
  const shadow = useRef<InstancedMesh>(null)
  const guide = useRef<InstancedMesh>(null)
  const sunBead = useRef<Group>(null)
  const moonBead = useRef<Group>(null)
  const matrix = useMemo(() => new Matrix4(), [])

  const bowl = useDisposable(() => {
    // Lower hemisphere, opening toward +z after the mesh rotation below.
    return new SphereGeometry(R, 128, 48, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
  }, [])
  const { lineColor } = appearance
  const rim = useDialTexture(DIAL_RADIUS + 1, drawRim, [])

  const pole = poleVector()

  useClockFrame((t, _dt, ms) => {
    const hours = t.hours + t.minutes / 60 + t.seconds / 3600
    const declination = declinationFromLongitude(solarLongitude(dayOfYear(ms)))
    const sun = sunVector(hours, declination)
    const day = sun.z > 0
    const mesh = shadow.current
    if (mesh) {
      mesh.visible = day
      if (day) {
        for (let i = 0; i < SHADOW_SAMPLES; i++) {
          const s = (i / (SHADOW_SAMPLES - 1)) * NEEDLE
          scratch.q.x = pole.x * s
          scratch.q.y = pole.y * s
          scratch.q.z = pole.z * s
          const p = shadowOnSphere(scratch.q, sun, R, scratch.p)
          const size = i === 0 ? 1.6 : 1 - (i / SHADOW_SAMPLES) * 0.4
          matrix
            .makeScale(size, size, size)
            .setPosition(p.x * 0.985, p.y * 0.985, p.z * 0.985 * SQUASH)
          mesh.setMatrixAt(i, matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
      }
    }
    // Reading guide: the current hour line (a meridian of the bowl) from the shadow tip down
    // to the row of hour numbers, ending in a marker between them.
    const dots = guide.current
    if (dots) {
      dots.visible = day
      if (day) {
        const end = SOLSTICE + 5
        for (let i = 0; i < GUIDE_SAMPLES; i++) {
          const f = i / (GUIDE_SAMPLES - 1)
          const p = tipShadow(hours, declination + (end - declination) * f)
          const size = !p ? 0 : i === GUIDE_SAMPLES - 1 ? 3 : i % 2 ? 0 : 1.1
          matrix.makeScale(size, size, size)
          if (p) matrix.setPosition(p.x * 0.98, p.y * 0.98, p.z * 0.98 * SQUASH)
          dots.setMatrixAt(i, matrix)
        }
        dots.instanceMatrix.needsUpdate = true
      }
    }
    if (sunBead.current) {
      sunBead.current.visible = day
      sunBead.current.rotation.z = dialRotationZ((Math.atan2(sun.x, sun.y) * 180) / Math.PI)
    }
    const night = nightWatch(hours)
    if (moonBead.current) {
      moonBead.current.visible = !day && night !== null
      if (night) moonBead.current.rotation.z = dialRotationZ(-90 + night.fraction * 180)
    }
  })

  const [ex, ey] = [0, pole.y * NEEDLE]
  const ez = pole.z * NEEDLE * SQUASH

  return (
    <WatchCase {...appearance} cavityDepth={R * SQUASH + 2}>
      {/* the bowl (시반) */}
      {/* flatten in world depth: the scale must apply after the hemisphere is turned */}
      <group scale={[1, 1, SQUASH]}>
        <mesh geometry={bowl} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color={appearance.bowlColor}
            metalness={0.35}
            roughness={0.55}
            side={BackSide}
          />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.2]}>
        <ringGeometry args={[R, DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.rimColor} metalness={0.5} roughness={0.5} />
      </mesh>
      <PrintLayer mask={rim} color="#f2e3c4" radius={DIAL_RADIUS + 1} inner={R} z={0.25} />

      <Lines points={grid.terms} segments color={lineColor} lineWidth={1.4} />
      <Lines
        points={grid.hourMinor}
        segments
        color={lineColor}
        lineWidth={0.8}
        transparent
        opacity={0.7}
      />
      <Lines points={grid.hourMajor} segments color={lineColor} lineWidth={2.2} />
      {labels.map((label) => (
        <LabelPlane
          key={label.text}
          label={label}
          color={lineColor}
          backing={appearance.bowlColor}
        />
      ))}

      {/* polar needle (영침): tip at the centre of the sphere, mounted to the north rim */}
      <Lines
        points={[
          [0, 0, 0],
          [ex, ey, ez],
        ]}
        color={appearance.caseColor}
        lineWidth={3}
      />
      <Lines
        points={[
          [ex, ey, ez],
          [0, R, 0.4],
        ]}
        color={appearance.caseColor}
        lineWidth={2}
      />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.1, 16, 12]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={1} roughness={0.3} />
      </mesh>

      <instancedMesh
        ref={shadow}
        args={[undefined, undefined, SHADOW_SAMPLES]}
        name="needle-shadow"
      >
        <sphereGeometry args={[1.3, 10, 8]} />
        <meshBasicMaterial color={appearance.shadowColor} transparent opacity={0.85} />
      </instancedMesh>

      <instancedMesh ref={guide} args={[undefined, undefined, GUIDE_SAMPLES]} name="time-guide">
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color={appearance.sunColor} toneMapped={false} />
      </instancedMesh>

      <group ref={sunBead}>
        <mesh position={[0, R + 7.5, 1.2]}>
          <sphereGeometry args={[2.4, 20, 14]} />
          <meshBasicMaterial color={appearance.sunColor} toneMapped={false} />
        </mesh>
      </group>
      <group ref={moonBead}>
        <mesh position={[0, R + 3, 1.2]}>
          <sphereGeometry args={[2.2, 20, 14]} />
          <meshStandardMaterial color="#e8ecf5" emissive="#9fb2ff" emissiveIntensity={0.6} />
        </mesh>
      </group>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
