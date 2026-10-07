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
import { createLabelCanvas, dialFont, drawLabels } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { PrintLayer } from '../../three/parts/PrintLayer'
import type { AngbuilguAppearance } from './appearance'
import {
  dayOfYear,
  declinationFromLongitude,
  nightWatch,
  poleVector,
  shadowOnSphere,
  SIJIN_HANJA,
  solarLongitude,
  sunVector,
  type Vec3,
} from './sky'

/** Bowl radius and how much its depth is flattened to fit a wrist. */
const R = 86
const SQUASH = 0.24
const NEEDLE = 40
const SHADOW_SAMPLES = 24
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

type Label = { text: string; position: P3; size: number }

function useLabels(): Label[] {
  return useMemo(() => {
    const labels: Label[] = []
    for (let h = FIRST_HOUR + 1; h <= LAST_HOUR - 1; h++) {
      const p = tipShadow(h, -SOLSTICE - 4)
      if (p) labels.push({ text: String(h), position: toBowl(p, 0.97), size: 8 })
    }
    // 시진 names at the middle of each double hour (卯 = 6 h … 酉 = 18 h).
    for (let h = 6; h <= 18; h += 2) {
      const p = tipShadow(h, -SOLSTICE - 10)
      const index = ((h + 1) / 2) | 0
      if (p) labels.push({ text: SIJIN_HANJA[index % 12], position: toBowl(p, 0.97), size: 11 })
    }
    const termLabels: Array<[string, number]> = [
      ['冬至', -SOLSTICE],
      ['春秋分', 0],
      ['夏至', SOLSTICE],
    ]
    for (const [text, d] of termLabels) {
      const p = tipShadow(17.4, d)
      if (p) labels.push({ text, position: toBowl(p, 0.97), size: 9 })
    }
    return labels
  }, [])
}

function LabelPlane({ label, color }: { label: Label; color: string }) {
  // White mask per label; the engraving colour is a material tint.
  const texture = useDisposable(() => {
    const t = new CanvasTexture(createLabelCanvas(label.text, dialFont(700, 40), '#ffffff'))
    t.colorSpace = SRGBColorSpace
    return t
  }, [label.text])
  const [x, y, z] = label.position
  return (
    <mesh position={[x, y, z + 0.4]}>
      <planeGeometry args={[label.size * 1.6, label.size * 1.6]} />
      <meshBasicMaterial map={texture} color={color} transparent depthWrite={false} />
    </mesh>
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
  const watches = ['初更', '二更', '三更', '四更', '五更']
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
        <LabelPlane key={label.text} label={label} color={lineColor} />
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
