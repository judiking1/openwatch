import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DataTexture, LinearFilter, type Group } from 'three'
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
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import type { PhaseAppearance } from './appearance'
import {
  createGrid,
  EMITTER_POSITIONS,
  FIELD_RADIUS,
  focusField,
  focusPhases,
  HOUR_RING,
  HOUR_WAVE,
  MINUTE_RING,
  MINUTE_WAVE,
  phasePose,
  polar,
  writeWave,
  type FieldGrid,
  type PhasePose,
} from './phase'

const GRID = 128
const CAP_RADIUS = 14

type Kind = 'hour' | 'minute'
const KINDS: Kind[] = ['hour', 'minute']
const WAVE = {
  hour: { ring: HOUR_RING, wavelength: HOUR_WAVE, z: 0.3, step: 0.4 },
  minute: { ring: MINUTE_RING, wavelength: MINUTE_WAVE, z: 0.35, step: 0.3 },
} as const

/** Hour numerals between the rings, minute scale across the outer ring (white mask). */
function drawScales(ctx: CanvasRenderingContext2D) {
  const print = '#ffffff'
  ctx.save()
  ctx.strokeStyle = print
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 0.25
  for (const r of [HOUR_RING, MINUTE_RING]) {
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
  drawTicks(ctx, {
    count: 12,
    inner: HOUR_RING - 2,
    outer: HOUR_RING + 2,
    color: print,
    width: 0.5,
  })
  drawLabels(ctx, HOUR_LABELS, { radius: 59, font: dialFont(700, 6), color: print })
  drawTicks(ctx, {
    count: 60,
    inner: MINUTE_RING - 1.2,
    outer: MINUTE_RING + 1.2,
    majorEvery: 5,
    majorInner: MINUTE_RING - 2.5,
    majorOuter: MINUTE_RING + 2.5,
    width: 0.25,
    majorWidth: 0.5,
    color: print,
  })
  drawLabels(ctx, FIVE_MINUTE_LABELS, { radius: 92, font: dialFont(600, 5.5), color: print })
}

type Field = {
  texture: DataTexture
  pixels: Uint8Array
  re: Float32Array
  im: Float32Array
  /** Focus angle the field was last computed for. */
  angle: number
}

function createField(): Field & { dispose(): void } {
  const pixels = new Uint8Array(GRID * GRID * 4)
  const texture = new DataTexture(pixels, GRID, GRID)
  texture.magFilter = texture.minFilter = LinearFilter
  texture.needsUpdate = true
  const cells = GRID * GRID
  return {
    texture,
    pixels,
    re: new Float32Array(cells),
    im: new Float32Array(cells),
    angle: NaN,
    dispose: () => texture.dispose(),
  }
}

/** Re-aims a field when its focus has moved visibly (the slow part), then draws the wave. */
function update(f: Field, grid: FieldGrid, kind: Kind, pose: PhasePose) {
  const w = WAVE[kind]
  if (!(Math.abs(pose[kind] - f.angle) < w.step)) {
    const phases = focusPhases(polar(w.ring, pose[kind]), w.wavelength)
    focusField(grid, phases, w.wavelength, f.re, f.im)
    f.angle = pose[kind]
  }
  writeWave(grid, f.re, f.im, pose.seconds, f.pixels)
  f.texture.needsUpdate = true
}

/** Wave colours are pushed into HDR so that only the foci cross the bloom threshold. */
const FOCUS_GAIN = 2.2

/** Watch 015 — Phase: a fixed phased array focuses waves on the hour and the minute. */
export function PhaseWatch({ appearance }: { appearance: PhaseAppearance }) {
  const scales = useDialTexture(DIAL_RADIUS, drawScales, [])
  const grid = useMemo(() => createGrid(GRID), [])
  const hourField = useDisposable(createField, [])
  const minuteField = useDisposable(createField, [])
  const second = useRef<Group>(null)
  const hourColor = useMemo(
    () => new Color(appearance.hourWaveColor).multiplyScalar(FOCUS_GAIN),
    [appearance.hourWaveColor],
  )
  const minuteColor = useMemo(
    () => new Color(appearance.minuteWaveColor).multiplyScalar(FOCUS_GAIN),
    [appearance.minuteWaveColor],
  )

  useClockFrame((t) => {
    const pose = phasePose(t)
    for (const kind of KINDS) update(kind === 'hour' ? hourField : minuteField, grid, kind, pose)
    if (second.current) second.current.rotation.z = dialRotationZ(pose.second)
  })

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.7} metalness={0.15} />
      </mesh>
      <PrintLayer mask={scales} color={appearance.printColor} radius={DIAL_RADIUS} />

      {KINDS.map((kind) => (
        <mesh key={kind} position-z={WAVE[kind].z}>
          <planeGeometry args={[FIELD_RADIUS * 2, FIELD_RADIUS * 2]} />
          <meshBasicMaterial
            map={(kind === 'hour' ? hourField : minuteField).texture}
            color={kind === 'hour' ? hourColor : minuteColor}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* the emitters */}
      {EMITTER_POSITIONS.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.8]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[1, 1, 1.6, 12]} />
          <meshStandardMaterial color={appearance.emitterColor} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* centre cap with the seconds hand */}
      <mesh position-z={1.2} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[CAP_RADIUS, CAP_RADIUS, 2.4, 64]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={0.9} roughness={0.25} />
      </mesh>
      <group ref={second} name="second" position-z={2.6}>
        <mesh position={[0, CAP_RADIUS / 2 - 2, 0]}>
          <boxGeometry args={[0.9, CAP_RADIUS + 1, 0.5]} />
          <meshStandardMaterial color={appearance.secondColor} roughness={0.4} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[1.6, 1.6, 0.8, 24]} />
          <meshStandardMaterial color={appearance.secondColor} roughness={0.4} />
        </mesh>
      </group>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
