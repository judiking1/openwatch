import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Matrix4,
  type InstancedMesh,
} from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { WatchCase } from '../../three/parts/WatchCase'
import {
  dialFont,
  drawLabels,
  drawTicks,
  FIVE_MINUTE_LABELS,
  HOUR_LABELS,
} from '../../three/utils/canvas'
import { DIAL_RADIUS } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs } from '../../utils/time'
import type { PlasmaAppearance } from './appearance'
import {
  AFTERGLOW,
  BINS,
  createBand,
  filamentPath,
  FILAMENTS,
  HOUR_RING,
  MINUTE_RING,
  plasmaPose,
  random,
  steadyPeak,
  stepBand,
  WANDER,
  type Band,
} from './plasma'

const SEGMENTS = 14
const BAND_WIDTH = 3.2
const BAND_Z = 0.4
/** Filaments arc up from the electrodes towards the crystal. */
const FILAMENT_Z = 1.6
const ARC_HEIGHT = { hour: 4, minute: 7 }
/** Phosphor brightness at the steady-state peak (> 1 blooms). */
const GLOW_GAIN = 1.5

type Kind = 'hour' | 'minute'
const KINDS: Kind[] = ['hour', 'minute']
const RING: Record<Kind, number> = { hour: HOUR_RING, minute: MINUTE_RING }

/** Hour numerals between the bands, minute scale outside the outer band (white mask). */
function drawScales(ctx: CanvasRenderingContext2D) {
  const print = '#ffffff'
  drawLabels(ctx, HOUR_LABELS, { radius: 62, font: dialFont(700, 6.5), color: print })
  drawTicks(ctx, {
    count: 12,
    inner: HOUR_RING + 3,
    outer: HOUR_RING + 5.5,
    color: print,
    width: 0.6,
  })
  drawTicks(ctx, {
    count: 60,
    inner: MINUTE_RING + 3,
    outer: MINUTE_RING + 5,
    majorEvery: 5,
    majorOuter: MINUTE_RING + 7,
    width: 0.3,
    majorWidth: 0.7,
    color: print,
  })
  drawLabels(ctx, FIVE_MINUTE_LABELS, { radius: 93, font: dialFont(600, 5), color: print })
}

/** Quad strips along each filament path: one draw for all filaments of a kind. */
function createRibbons(count: number) {
  const verts = count * (SEGMENTS + 1) * 2
  const geometry = new BufferGeometry()
  const position = new BufferAttribute(new Float32Array(verts * 3), 3)
  position.setUsage(DynamicDrawUsage)
  geometry.setAttribute('position', position)
  const index: number[] = []
  for (let f = 0; f < count; f++) {
    const base = f * (SEGMENTS + 1) * 2
    for (let i = 0; i < SEGMENTS; i++) {
      const a = base + i * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  geometry.setIndex(index)
  return geometry
}

/** Ribbons for both kinds, disposed together. */
function ribbonSet() {
  const set = { hour: createRibbons(FILAMENTS.hour), minute: createRibbons(FILAMENTS.minute) }
  return {
    ...set,
    dispose() {
      set.hour.dispose()
      set.minute.dispose()
    },
  }
}

function writeRibbon(
  geometry: BufferGeometry,
  filament: number,
  path: Float32Array,
  width: number,
  arc: number,
) {
  const out = geometry.getAttribute('position').array as Float32Array
  const base = filament * (SEGMENTS + 1) * 2 * 3
  for (let i = 0; i <= SEGMENTS; i++) {
    const j = Math.min(i + 1, SEGMENTS)
    const k = Math.max(i - 1, 0)
    const dx = path[j * 2] - path[k * 2]
    const dy = path[j * 2 + 1] - path[k * 2 + 1]
    const len = Math.hypot(dx, dy) || 1
    const f = i / SEGMENTS
    // Thinner at the electrodes, widest mid-arc.
    const w = (width / 2) * (0.35 + 0.65 * Math.sin(Math.PI * f))
    const nx = (-dy / len) * w
    const ny = (dx / len) * w
    const z = FILAMENT_Z + arc * Math.sin(Math.PI * f)
    const o = base + i * 6
    out[o] = path[i * 2] + nx
    out[o + 1] = path[i * 2 + 1] + ny
    out[o + 2] = z
    out[o + 3] = path[i * 2] - nx
    out[o + 4] = path[i * 2 + 1] - ny
    out[o + 5] = z
  }
}

/** A phosphor band: one small additive tile per bin, brightness via instance colour. */
function Phosphor({
  ring,
  color,
  bandRef,
}: {
  ring: number
  color: string
  bandRef: (mesh: InstancedMesh | null) => void
}) {
  const local = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = local.current
    if (!mesh) return
    const m = new Matrix4()
    const black = new Color(0, 0, 0)
    for (let i = 0; i < BINS; i++) {
      const a = ((i + 0.5) / BINS) * Math.PI * 2
      m.makeRotationZ(-a).setPosition(ring * Math.sin(a), ring * Math.cos(a), BAND_Z)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, black)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [ring])
  const tile = (2 * Math.PI * ring) / BINS
  return (
    <instancedMesh
      ref={(mesh) => {
        local.current = mesh
        bandRef(mesh)
      }}
      args={[undefined, undefined, BINS]}
      frustumCulled={false}
      userData={{ lume: true }}
    >
      <planeGeometry args={[tile * 1.05, BAND_WIDTH]} />
      <meshBasicMaterial
        color={color}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

/** Watch 014 — Plasma: random filaments; their phosphor afterglow piles up at the time. */
export function PlasmaWatch({ appearance }: { appearance: PlasmaAppearance }) {
  const scales = useDialTexture(DIAL_RADIUS, drawScales, [])
  const rand = useMemo(() => random(2026), [])
  // Pre-run three afterglow times so the glow is there when the watch appears.
  const bands = useMemo(() => {
    const pose = plasmaPose(clockTimeFromMs(useTimeStore.getState().now()))
    const r = random(14)
    const made = {} as Record<Kind, Band>
    for (const kind of KINDS) {
      made[kind] = createBand(FILAMENTS[kind], WANDER[kind], r)
      for (let i = 0; i < AFTERGLOW * 3 * 30; i++)
        stepBand(made[kind], pose[kind], WANDER[kind], 1 / 30, r)
    }
    return made
  }, [])
  const cores = useDisposable(() => ribbonSet(), [])
  const halos = useDisposable(() => ribbonSet(), [])
  const phosphor = useRef<Partial<Record<Kind, InstancedMesh | null>>>({})
  const path = useMemo(() => new Float32Array((SEGMENTS + 1) * 2), [])
  const glow = useMemo(() => new Color(), [])
  const peaks = useMemo(
    () => ({
      hour: steadyPeak(FILAMENTS.hour, WANDER.hour),
      minute: steadyPeak(FILAMENTS.minute, WANDER.minute),
    }),
    [],
  )

  useClockFrame((t, delta) => {
    const pose = plasmaPose(t)
    const dt = Math.min(delta, 1 / 20)
    for (const kind of KINDS) {
      const band = bands[kind]
      stepBand(band, pose[kind], WANDER[kind], dt, rand)
      band.offsets.forEach((offset, f) => {
        filamentPath(pose[kind] + offset, RING[kind], SEGMENTS, rand, path)
        writeRibbon(cores[kind], f, path, 0.45, ARC_HEIGHT[kind])
        writeRibbon(halos[kind], f, path, 2.4, ARC_HEIGHT[kind])
      })
      cores[kind].getAttribute('position').needsUpdate = true
      halos[kind].getAttribute('position').needsUpdate = true
      const mesh = phosphor.current[kind]
      if (!mesh?.instanceColor) continue
      for (let i = 0; i < BINS; i++) {
        const b = Math.min(1.6, (band.bins[i] / peaks[kind]) * GLOW_GAIN)
        mesh.setColorAt(i, glow.setScalar(b))
      }
      mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.8} metalness={0.1} />
      </mesh>
      <PrintLayer mask={scales} color={appearance.printColor} radius={DIAL_RADIUS} />

      {KINDS.map((kind) => (
        <group key={kind}>
          {/* electrode ring with its phosphor band */}
          <mesh position-z={0.2}>
            <torusGeometry args={[RING[kind], 0.45, 8, 160]} />
            <meshStandardMaterial
              color={appearance.electrodeColor}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
          <Phosphor
            ring={RING[kind]}
            color={kind === 'hour' ? appearance.hourGlowColor : appearance.minuteGlowColor}
            bandRef={(mesh) => void (phosphor.current[kind] = mesh)}
          />
          {/* filaments: violet halo and a white-hot core */}
          <mesh geometry={halos[kind]} frustumCulled={false}>
            <meshBasicMaterial
              color={appearance.filamentColor}
              transparent
              opacity={0.55}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh geometry={cores[kind]} frustumCulled={false}>
            <meshBasicMaterial
              color="#ffffff"
              transparent
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* the central electrode */}
      <mesh position-z={3}>
        <sphereGeometry args={[7, 32, 24]} />
        <meshStandardMaterial
          color={appearance.electrodeColor}
          emissive={appearance.filamentColor}
          emissiveIntensity={0.8}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
