import { useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Color, ShaderMaterial, Vector2, Vector3, type Group, type Mesh } from 'three'
import { StableFluid } from '../../three/fluid/StableFluid'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, fillDisc } from '../../three/utils/canvas'
import { DIAL_RADIUS } from '../../three/utils/dial'
import { SIJIN, SIJIN_HANJA } from '../angbuilgu/sky'
import type { JagyeongnuAppearance } from './appearance'
import { dropFall, GAK_LABELS, waterClock } from './waterClock'

/** The inflow vessel (수수호), in dial units. */
const VESSEL = { x0: -22, x1: 18, y0: -74, y1: 52 }
const VESSEL_W = VESSEL.x1 - VESSEL.x0
const VESSEL_H = VESSEL.y1 - VESSEL.y0
const VESSEL_CX = (VESSEL.x0 + VESSEL.x1) / 2
const SPOUT_Y = 62
const PLAQUE = { x: 52, y: 6, w: 34, h: 52 }

const WATER_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

/** Shades the simulated water below a moving free surface. */
const WATER_FRAGMENT = /* glsl */ `
uniform sampler2D dye;
uniform sampler2D velocity;
uniform float level;
uniform float time;
uniform float impactAge;
uniform vec3 deep;
uniform vec3 shallow;
varying vec2 vUv;
void main() {
  float ripple = 0.004 * sin(vUv.x * 38.0 + time * 2.6)
    + 0.006 * exp(-impactAge * 5.0) * cos(30.0 * abs(vUv.x - 0.55) - impactAge * 18.0)
      * exp(-abs(vUv.x - 0.55) * 4.0);
  float surface = level + ripple;
  if (vUv.y > surface) discard;
  float depth = clamp(vUv.y / max(level, 0.001), 0.0, 1.0);
  vec3 color = mix(deep, shallow, pow(depth, 1.6));
  vec3 d = texture2D(dye, vUv).rgb;
  float speed = length(texture2D(velocity, vUv).xy);
  color += d * 0.6 + vec3(0.06) * smoothstep(5.0, 60.0, speed);
  float meniscus = smoothstep(0.012, 0.0, surface - vUv.y);
  color = mix(color, vec3(0.85, 0.95, 1.0), meniscus * 0.7);
  gl_FragColor = vec4(color, 0.82 + 0.15 * meniscus);
}`

function drawDial(ctx: CanvasRenderingContext2D, dial: string, print: string) {
  fillDisc(ctx, dial, DIAL_RADIUS)
  ctx.save()
  ctx.strokeStyle = print
  ctx.fillStyle = print
  ctx.textBaseline = 'middle'
  // Canvas y is down: dial y → −y.
  for (let i = 0; i <= 8; i++) {
    const y = -(VESSEL.y0 + (VESSEL_H * i) / 8)
    const major = i % 2 === 0
    ctx.lineWidth = major ? 0.9 : 0.5
    ctx.beginPath()
    ctx.moveTo(VESSEL.x0 - (major ? 7 : 4), y)
    ctx.lineTo(VESSEL.x0 - 1, y)
    ctx.moveTo(VESSEL.x1 + 1, y)
    ctx.lineTo(VESSEL.x1 + 4, y)
    ctx.stroke()
    ctx.textAlign = 'right'
    ctx.font = dialFont(600, 5)
    if (major) ctx.fillText(String(i * 15), VESSEL.x0 - 8.5, y)
    if (i < 8) {
      ctx.textAlign = 'left'
      ctx.font = dialFont(600, 3.6)
      ctx.fillText(GAK_LABELS[i], VESSEL.x1 + 5, y - VESSEL_H / 16)
    }
  }
  ctx.textAlign = 'center'
  ctx.font = dialFont(700, 5)
  ctx.fillText('分', VESSEL.x0 - 11, -(VESSEL.y1 + 7))
  ctx.fillText('刻', VESSEL.x1 + 9, -(VESSEL.y1 + 7))
  ctx.restore()
}

function drawPlaque(ctx: CanvasRenderingContext2D, sijin: number, half: string, color: string) {
  const { w, h } = PLAQUE
  ctx.fillStyle = color
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.strokeStyle = '#e8c87a'
  ctx.lineWidth = 1.2
  ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4)
  ctx.fillStyle = '#f6e7c1'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = dialFont(800, 26)
  ctx.fillText(SIJIN_HANJA[sijin], 0, -6)
  ctx.font = dialFont(700, 7)
  ctx.fillText(`${SIJIN[sijin]}시 ${half}`, 0, 16)
}

/** Watch 011 — Jagyeongnu: a self-striking water clock with simulated water. */
export function JagyeongnuWatch({ appearance }: { appearance: JagyeongnuAppearance }) {
  const gl = useThree((s) => s.gl)
  const fluid = useDisposable(
    () =>
      new StableFluid({ width: 64, height: 200, pressureIterations: 20, dyeDissipation: 0.975 }),
    [],
  )
  const material = useDisposable(
    () =>
      new ShaderMaterial({
        vertexShader: WATER_VERTEX,
        fragmentShader: WATER_FRAGMENT,
        transparent: true,
        uniforms: {
          dye: { value: null },
          velocity: { value: null },
          level: { value: 0 },
          time: { value: 0 },
          impactAge: { value: 10 },
          deep: { value: new Color() },
          shallow: { value: new Color() },
        },
      }),
    [],
  )
  const water = useRef<Mesh>(null)
  const drop = useRef<Group>(null)
  const lastImpact = useRef(-1)
  const elapsed = useRef(0)
  const impactAge = useRef(10)

  const { dialColor, printColor, plaqueColor } = appearance
  const dial = useDialTexture(DIAL_RADIUS, (ctx) => drawDial(ctx, dialColor, printColor), [
    dialColor,
    printColor,
  ])
  const [plaque, setPlaque] = useState<{ sijin: number; half: string } | null>(null)
  const plaqueGroup = useRef<Group>(null)

  useClockFrame((t, dt) => {
    const state = waterClock(t)
    if (plaque?.sijin !== state.sijin || plaque?.half !== state.half) {
      setPlaque({ sijin: state.sijin, half: state.half })
    }
    elapsed.current += dt
    const step = Math.min(dt, 1 / 30)

    // A drop leaves the spout each second; on impact it stirs the water.
    const fall = dropFall(t)
    const surfaceY = VESSEL.y0 + VESSEL_H * state.level
    if (drop.current) {
      drop.current.visible = fall !== null && state.flush === null
      if (fall !== null) drop.current.position.y = SPOUT_Y + (surfaceY - SPOUT_Y) * fall
    }
    const second = t.hours * 3600 + t.minutes * 60 + t.seconds
    if (fall === null && second !== lastImpact.current && state.flush === null) {
      lastImpact.current = second
      impactAge.current = 0
      const x = (0 - VESSEL.x0) / VESSEL_W
      fluid.splat(
        x + (Math.random() - 0.5) * 0.04,
        Math.max(state.level - 0.01, 0.02),
        new Vector2((Math.random() - 0.5) * 60, -260),
        new Vector3(0.12, 0.2, 0.26),
        0.0025,
      )
    }
    if (state.flush !== null) {
      // The siphon drains from the bottom corner.
      fluid.splat(0.9, 0.04, new Vector2(120, -60), new Vector3(0.05, 0.1, 0.15), 0.004)
    }
    fluid.step(gl, step, Math.max(state.level, 0.01))

    const shader = water.current?.material as ShaderMaterial | undefined
    if (shader) {
      const u = shader.uniforms
      u.dye.value = fluid.dyeTexture
      u.velocity.value = fluid.velocityTexture
      u.level.value = state.level
      u.time.value = elapsed.current
      u.impactAge.value = impactAge.current
      u.deep.value.set(appearance.waterDeep)
      u.shallow.value.set(appearance.waterShallow)
      // GLB export cannot carry a shader; it falls back to this colour.
      shader.userData.exportColor = appearance.waterShallow
    }
    impactAge.current += step

    // The plaque flips about its vertical axis while the vessel empties.
    if (plaqueGroup.current) {
      const flipping = state.flush !== null ? Math.sin(state.flush * Math.PI) : 0
      plaqueGroup.current.rotation.y = flipping * Math.PI * 0.5
    }
  })

  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial map={dial} roughness={0.8} />
      </mesh>

      {/* reservoir (파수호) and spout */}
      <mesh position={[VESSEL_CX, 74, 2]}>
        <boxGeometry args={[46, 14, 4]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[VESSEL_CX, 75, 4.1]}>
        <planeGeometry args={[42, 8]} />
        <meshStandardMaterial color={appearance.waterShallow} roughness={0.2} />
      </mesh>
      <mesh position={[0, SPOUT_Y + 2.5, 2]}>
        <cylinderGeometry args={[1.2, 1.6, 5, 16]} />
        <meshStandardMaterial color={appearance.caseColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={drop} position={[0, SPOUT_Y, 2]}>
        <mesh>
          <sphereGeometry args={[1.3, 16, 12]} />
          <meshStandardMaterial color={appearance.waterShallow} roughness={0.1} />
        </mesh>
      </group>

      {/* inflow vessel (수수호): simulated water behind a glass front */}
      <mesh
        ref={water}
        name="minute"
        position={[VESSEL_CX, (VESSEL.y0 + VESSEL.y1) / 2, 1]}
        material={material}
      >
        <planeGeometry args={[VESSEL_W, VESSEL_H]} />
      </mesh>
      {[
        [VESSEL.x0 - 0.6, (VESSEL.y0 + VESSEL.y1) / 2, 1.2, VESSEL_H + 2.4],
        [VESSEL.x1 + 0.6, (VESSEL.y0 + VESSEL.y1) / 2, 1.2, VESSEL_H + 2.4],
        [VESSEL_CX, VESSEL.y0 - 0.6, VESSEL_W + 2.4, 1.2],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 2]}>
          <boxGeometry args={[w, h, 4]} />
          <meshStandardMaterial color={appearance.caseColor} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[VESSEL_CX, (VESSEL.y0 + VESSEL.y1) / 2, 4.2]}>
        <planeGeometry args={[VESSEL_W, VESSEL_H]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          roughness={0.05}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>

      <group ref={plaqueGroup} position={[PLAQUE.x, PLAQUE.y, 3]}>
        {plaque && <Plaque sijin={plaque.sijin} half={plaque.half} color={plaqueColor} />}
      </group>

      <Crystal {...appearance} />
    </WatchCase>
  )
}

/** Re-draws its texture only when the 시진 or its half changes. */
function Plaque({ sijin, half, color }: { sijin: number; half: string; color: string }) {
  const texture = useDialTexture(
    PLAQUE.h / 2,
    (ctx) => drawPlaque(ctx, sijin, half, color),
    [sijin, half, color],
    512,
  )
  return (
    <mesh name="hour">
      <planeGeometry args={[PLAQUE.h, PLAQUE.h]} />
      <meshStandardMaterial map={texture} transparent roughness={0.5} />
    </mesh>
  )
}
