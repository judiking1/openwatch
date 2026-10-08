import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, type Group, type InstancedMesh } from 'three'
import { useClockFrame, useDialTexture } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { rendererKind } from '../../three/renderer'
import { tilt } from '../../three/stage/tilt'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, drawLabels, drawTicks, HOUR_LABELS } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, dialPoint } from '../../utils/time'
import type { ChladniAppearance } from './appearance'
import { PLATE_RADIUS, platePose, random, ringRadius, scatterSand, stepSand } from './sand'
import { useComputeSand } from './useComputeSand'

const GRAINS = 4000
/** Steps run on mount (~3 s of sand time). */
const SETTLE_STEPS = 180
const GRAIN_Z = 0.7
const HOUR_RING = 92.5

/** Faint minute circles every five minutes with labels up the 12 o'clock radius (white mask). */
function drawPlate(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.lineWidth = 0.3
  for (let m = 0; m <= 55; m += 5) {
    ctx.beginPath()
    ctx.arc(0, 0, ringRadius(m), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.font = dialFont(700, 3.8)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let m = 0; m <= 55; m += 5) {
    for (const spoke of [0, 180]) {
      const p = dialPoint(ringRadius(m), spoke)
      ctx.fillText(String(m), p.x + 3.6, p.y)
    }
  }
  ctx.restore()
}

/** Hour numerals on the rim around the plate (white mask). */
function drawRim(ctx: CanvasRenderingContext2D) {
  drawLabels(ctx, HOUR_LABELS, { radius: HOUR_RING, font: dialFont(700, 6.5), color: '#ffffff' })
  drawTicks(ctx, {
    count: 60,
    inner: 87,
    outer: 88.4,
    color: '#ffffff',
    width: 0.35,
    skip: (i) => i % 5 === 0,
  })
}

/** Watch 013 — Chladni: sand on a vibrating plate settles where it is still; that is the time. */
export function ChladniWatch({ appearance }: { appearance: ChladniAppearance }) {
  const sand = useRef<InstancedMesh>(null)
  const gl = useThree((s) => s.gl)
  // WebGPU backend: 8× the grains on a compute shader; elsewhere the CPU model below.
  const { compute } = rendererKind(gl)
  const gpuSand = useComputeSand(compute, GRAIN_Z)
  const exciter = useRef<Group>(null)
  const rand = useMemo(() => random(1787), [])
  // Scattered, then settled to the current time so the pattern is there when the watch appears.
  const grains = useMemo(() => {
    const scattered = scatterSand(GRAINS, random(1787))
    const pose = platePose(clockTimeFromMs(useTimeStore.getState().now()))
    for (let i = 0; i < SETTLE_STEPS; i++) stepSand(scattered, pose, 1 / 60, rand)
    return scattered
  }, [rand])
  const plate = useDialTexture(PLATE_RADIUS, drawPlate, [])
  const rim = useDialTexture(DIAL_RADIUS + 1, drawRim, [])

  useLayoutEffect(() => {
    const mesh = sand.current
    if (!mesh) return
    const m = new Matrix4()
    for (let i = 0; i < GRAINS; i++) {
      const s = 0.75 + ((i * 7919) % 100) / 200
      mesh.setMatrixAt(i, m.makeScale(s, s, s).setPosition(0, 0, GRAIN_Z))
    }
  }, [])

  useClockFrame((t, dt) => {
    const pose = platePose(t)
    // Two substeps keep the drift stable at low frame rates.
    const step = Math.min(dt, 1 / 30) / 2
    if (gpuSand) {
      gpuSand.step(gl, pose, step, tilt)
      gpuSand.step(gl, pose, step, tilt)
    } else if (!compute) {
      stepSand(grains, pose, step, rand, tilt)
      stepSand(grains, pose, step, rand, tilt)
    }
    const mesh = sand.current
    if (mesh && !compute) {
      const matrices = mesh.instanceMatrix.array as Float32Array
      for (let i = 0; i < GRAINS; i++) {
        matrices[i * 16 + 12] = grains[i * 2]
        matrices[i * 16 + 13] = grains[i * 2 + 1]
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    if (exciter.current) exciter.current.rotation.z = dialRotationZ(pose.hour)
  })

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.rimColor} roughness={0.6} metalness={0.3} />
      </mesh>
      <PrintLayer
        mask={rim}
        color={appearance.numeralColor}
        radius={DIAL_RADIUS + 1}
        inner={PLATE_RADIUS + 1}
      />
      {/* the plate, slightly raised */}
      <mesh position-z={0.3} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[PLATE_RADIUS, PLATE_RADIUS, 0.6, 128]} />
        <meshStandardMaterial color={appearance.plateColor} roughness={0.35} metalness={0.7} />
      </mesh>
      <PrintLayer mask={plate} color={appearance.scaleColor} radius={PLATE_RADIUS} z={0.62} />

      {compute ? (
        gpuSand && <primitive object={gpuSand.mesh} material-color={appearance.sandColor} />
      ) : (
        <instancedMesh
          ref={sand}
          args={[undefined, undefined, GRAINS]}
          name="sand"
          frustumCulled={false}
        >
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={appearance.sandColor} roughness={0.9} />
        </instancedMesh>
      )}

      {/* the exciter on the rim: the still diameter's hour end */}
      <group ref={exciter} name="hour">
        <mesh position={[0, PLATE_RADIUS + 2.2, 1.6]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[2.2, 2.2, 3, 24]} />
          <meshStandardMaterial color={appearance.exciterColor} metalness={0.9} roughness={0.25} />
        </mesh>
      </group>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
