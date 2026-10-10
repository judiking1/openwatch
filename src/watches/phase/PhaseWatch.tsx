import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AdditiveBlending, Color, type Group } from 'three'
import { useClockFrame, useDialTexture } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { TouchSurface, type TouchPoint } from '../../three/parts/TouchSurface'
import { WatchCase } from '../../three/parts/WatchCase'
import { rendererKind } from '../../three/renderer'
import {
  dialFont,
  drawLabels,
  drawTicks,
  FIVE_MINUTE_LABELS,
  HOUR_LABELS,
} from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import type { PhaseAppearance } from './appearance'
import { EMITTER_POSITIONS, HOUR_RING, MINUTE_RING, phasePose, polar } from './phase'
import { SIM_DT, WALL } from './wave'
import { createCpuWaves, WAVE_FIELDS, type WaveField, type WaveKind } from './waveField'

const CAP_RADIUS = 14

type Kind = 'hour' | 'minute'
const KINDS: Kind[] = ['hour', 'minute']

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

/** Simulation steps run on top of real time per frame until the waves have filled the dial. */
const CATCH_UP = 12
/** At most this much clock time is simulated per frame (fast-forward plays slower). */
const MAX_FRAME = 3 * SIM_DT

/**
 * The two wave fields: compute shaders on the WebGPU backend (loaded on demand), the CPU
 * solver elsewhere. Null while the compute module loads.
 */
function useWaveFields(compute: boolean) {
  const [fields, setFields] = useState<Record<WaveKind, WaveField> | null>(null)
  useEffect(() => {
    let live = true
    let made: Record<WaveKind, WaveField> | undefined
    const factory = compute
      ? import('./waveCompute').then((m) => m.createComputeWaves)
      : Promise.resolve(createCpuWaves)
    void factory.then((create) => {
      if (!live) return
      made = { hour: create('hour'), minute: create('minute') }
      setFields(made)
    })
    return () => {
      live = false
      made?.hour.dispose()
      made?.minute.dispose()
      setFields(null)
    }
  }, [compute])
  return fields
}

/** Wave colours are pushed into HDR so that only the foci cross the bloom threshold. */
const FOCUS_GAIN = 2.2

/** Watch 015 — Phase: a fixed phased array focuses waves on the hour and the minute. */
export function PhaseWatch({ appearance }: { appearance: PhaseAppearance }) {
  const scales = useDialTexture(DIAL_RADIUS, drawScales, [])
  const gl = useThree((state) => state.gl)
  const fields = useWaveFields(rendererKind(gl).compute)
  // A touch on the crystal is a third wave source, in both fields.
  const touch = useRef<TouchPoint | null>(null)
  const clock = useRef({ last: NaN, carry: 0, warm: { hour: 0, minute: 0 } })
  useEffect(() => {
    // New fields start empty: run their warm-up quickly over the next frames.
    clock.current.warm = {
      hour: WAVE_FIELDS.hour.warm / SIM_DT,
      minute: WAVE_FIELDS.minute.warm / SIM_DT,
    }
  }, [fields])
  const second = useRef<Group>(null)
  const hourColor = useMemo(
    () => new Color(appearance.hourWaveColor).multiplyScalar(FOCUS_GAIN),
    [appearance.hourWaveColor],
  )
  const minuteColor = useMemo(
    () => new Color(appearance.minuteWaveColor).multiplyScalar(FOCUS_GAIN),
    [appearance.minuteWaveColor],
  )

  useClockFrame((t, _delta, ms) => {
    const pose = phasePose(t)
    const c = clock.current
    // Waves run on the watch's own time: they hold still while paused or rewound.
    const elapsed = Number.isNaN(c.last) ? 0 : (ms - c.last) / 1000
    c.last = ms
    c.carry = Math.min(c.carry + Math.max(0, elapsed), MAX_FRAME)
    const steps = Math.floor(c.carry / SIM_DT)
    c.carry -= steps * SIM_DT
    if (fields) {
      for (const kind of KINDS) {
        const catchUp = Math.min(c.warm[kind], CATCH_UP)
        c.warm[kind] -= catchUp
        fields[kind].advance(
          gl,
          polar(WAVE_FIELDS[kind].ring, pose[kind]),
          touch.current,
          steps + catchUp,
        )
      }
    }
    if (second.current) second.current.rotation.z = dialRotationZ(pose.second)
  })

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.7} metalness={0.15} />
      </mesh>
      <PrintLayer mask={scales} color={appearance.printColor} radius={DIAL_RADIUS} />

      {fields &&
        KINDS.map((kind) => (
          <mesh key={kind} position-z={kind === 'hour' ? 0.3 : 0.35}>
            <planeGeometry args={[WALL * 2, WALL * 2]} />
            <meshBasicMaterial
              map={fields[kind].texture}
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

      <TouchSurface onTouch={(p) => void (touch.current = p)} />
      <Crystal {...appearance} />
    </WatchCase>
  )
}
