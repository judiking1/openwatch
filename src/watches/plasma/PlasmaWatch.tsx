import { useMemo, useRef } from 'react'
import { Color, type Group, type InstancedMesh } from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { TouchSurface, type TouchPoint } from '../../three/parts/TouchSurface'
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
import { randomEvents } from '../../utils/random'
import { clockTimeFromMs } from '../../utils/time'
import type { PlasmaAppearance } from './appearance'
import { Filaments } from './Filaments'
import { Phosphor } from './Phosphor'
import { createCoreMaterial, flashCores, ribbonSet, SEGMENTS, writeRibbon } from './ribbons'
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
  CRYSTAL_Z,
  STRIKE_FADE,
  STRIKE_RATE,
  TOUCH_FILAMENTS,
  TOUCH_JITTER,
  touchTarget,
  type Band,
} from './plasma'

/** Filaments arc up from the electrodes towards the crystal. */
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
  const lift = useMemo(() => new Float32Array(SEGMENTS + 1), [])
  // Strikes: brief flashes at the instants the crackle sound also uses.
  const coreMaterial = useDisposable(createCoreMaterial, [])
  const strike = useRef({ last: NaN, flash: 0 })
  const glow = useMemo(() => new Color(), [])
  // Where the crystal is touched (dial units), or null.
  const touch = useRef<TouchPoint | null>(null)
  const touchGroup = useRef<Group>(null)
  const peaks = useMemo(
    () => ({
      hour: steadyPeak(FILAMENTS.hour, WANDER.hour),
      minute: steadyPeak(FILAMENTS.minute, WANDER.minute),
    }),
    [],
  )

  useClockFrame((t, delta, ms) => {
    const pose = plasmaPose(t)
    const dt = Math.min(delta, 1 / 20)
    const s = strike.current
    if (!Number.isNaN(s.last) && randomEvents(s.last, ms, STRIKE_RATE).length) s.flash = 1
    s.last = ms
    s.flash *= Math.exp(-dt / STRIKE_FADE)
    flashCores(coreMaterial, s.flash)
    for (const kind of KINDS) {
      const band = bands[kind]
      stepBand(band, pose[kind], WANDER[kind], dt, rand)
      band.offsets.forEach((offset, f) => {
        filamentPath(pose[kind] + offset, RING[kind], SEGMENTS, rand, path, lift)
        // Each frame a slightly different arc: the filaments breathe up and down.
        const arc = ARC_HEIGHT[kind] * (0.7 + 0.6 * rand())
        writeRibbon(cores[kind], f, path, 0.45, arc, lift)
        writeRibbon(halos[kind], f, path, 2.4, arc, lift)
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
    const target = touch.current && touchTarget(touch.current.x, touch.current.y)
    if (touchGroup.current) touchGroup.current.visible = target !== null
    if (target) {
      for (let f = 0; f < TOUCH_FILAMENTS; f++) {
        const angle = target.angle + (rand() - 0.5) * 2 * TOUCH_JITTER
        filamentPath(angle, target.radius, SEGMENTS, rand, path, lift)
        writeRibbon(cores.touch, f, path, 0.6, 3, lift, CRYSTAL_Z)
        writeRibbon(halos.touch, f, path, 3.2, 3, lift, CRYSTAL_Z)
      }
      cores.touch.getAttribute('position').needsUpdate = true
      halos.touch.getAttribute('position').needsUpdate = true
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
          <Filaments
            halo={halos[kind]}
            core={cores[kind]}
            color={appearance.filamentColor}
            coreMaterial={coreMaterial}
          />
        </group>
      ))}

      {/* a touch on the crystal pulls filaments up to it (hidden until touched) */}
      <group ref={touchGroup} visible={false}>
        <Filaments
          halo={halos.touch}
          core={cores.touch}
          color={appearance.filamentColor}
          coreMaterial={coreMaterial}
        />
      </group>
      <TouchSurface onTouch={(p) => void (touch.current = p)} z={CRYSTAL_Z + 0.4} />

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
