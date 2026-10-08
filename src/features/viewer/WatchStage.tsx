import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  useImperativeHandle,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref,
} from 'react'
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  NeutralToneMapping,
  PCFShadowMap,
  type Group,
  type ToneMapping,
} from 'three'
import { StudioLighting } from '../../three/lighting/StudioLighting'
import { StageBloom } from '../../three/postfx/StageBloom'
import { StageBackground } from '../../three/StageBackground'
import { ExplodeController } from '../../three/stage/ExplodeController'
import { LUME_BLOOM } from '../../three/stage/lume'
import { LumeController } from '../../three/stage/LumeController'
import { BlueprintController } from '../../three/stage/BlueprintController'
import { BlueprintDimensions } from '../../three/stage/BlueprintDimensions'
import { useStageStore } from '../../stores/stageStore'
import type { PostEffects, SoundProfile } from '../../types/watch'
import { AudioDriver } from '../audio/AudioDriver'
import { DEFAULT_SOUND } from '../audio/schedule'
import { RenderStatsProbe, type RenderSample } from '../../three/RenderStats'
import type { RendererMode } from './rendererMode'
import type { ToneMappingName } from './toneMapping'
import { createWatchRenderer, LinearBlendingContext, rendererKind } from '../../three/renderer'

const TONE_MAPPINGS: Record<ToneMappingName, ToneMapping> = {
  aces: ACESFilmicToneMapping,
  agx: AgXToneMapping,
  neutral: NeutralToneMapping,
}

/** Watch models are authored in dial units (dial radius 100); the scene uses ~1. */
export const DIAL_UNIT = 0.01

export type WatchStageHandle = {
  resetCamera: () => void
  /** The watch model root (excludes lights, environment and controls). */
  getModelRoot: () => Group | null
}

type Props = {
  children: ReactNode
  ref?: Ref<WatchStageHandle>
  /** Show renderer statistics (draw calls, triangles, memory, fps). */
  stats?: boolean
  toneMapping?: ToneMappingName
  /** `webgpu` opts into the experimental WebGPURenderer (`?renderer=webgpu`). */
  renderer?: RendererMode
  /** Post effects requested by the concept. */
  postFx?: PostEffects
  /** How the concept sounds when the visitor turns sound on. */
  sound?: SoundProfile
}

export function WatchStage({
  children,
  ref,
  stats = false,
  toneMapping = 'aces',
  renderer = 'webgl',
  postFx,
  sound = DEFAULT_SOUND,
}: Props) {
  const [sample, setSample] = useState<RenderSample | null>(null)
  // The lume (night) view needs bloom even for concepts that do not request it.
  const lume = useStageStore((s) => s.lume)
  const blueprint = useStageStore((s) => s.blueprint)
  const bloom = blueprint ? undefined : lume ? LUME_BLOOM : postFx?.bloom
  const [backend, setBackend] = useState('')
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const modelRoot = useRef<Group>(null)
  useImperativeHandle(ref, () => ({
    resetCamera: () => controls.current?.reset(),
    getModelRoot: () => modelRoot.current,
  }))

  return (
    <>
      <Canvas
        // three r186 dropped PCFSoftShadowMap (R3F's default) on both renderers.
        shadows={{ type: PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: [0.5, -1.1, 7.9], fov: 35, near: 0.05, far: 50 }}
        gl={createWatchRenderer(renderer, {
          // Explicit (R3F's implicit default is ACES): highlights on polished metal roll off.
          toneMapping: TONE_MAPPINGS[toneMapping],
          preserveDrawingBuffer: true,
        })}
        onCreated={async (state) => {
          setBackend(rendererKind(state.gl).label)
          try {
            const gl = state.gl as unknown as {
              compileAsync?: (s: unknown, c: unknown) => Promise<unknown>
              compile?: (s: unknown, c: unknown) => void
            }
            if (typeof gl.compileAsync === 'function') {
              await gl.compileAsync(state.scene, state.camera)
            } else if (typeof gl.compile === 'function') {
              gl.compile(state.scene, state.camera)
            }
          } catch {
            // Warm-up compilation failure is non-fatal
          }
        }}
      >
        <StageBackground color="#0e0f13" transparent={!!bloom || blueprint} />
        <StudioLighting />
        <LinearBlendingContext value={!!bloom}>
          <group ref={modelRoot} scale={DIAL_UNIT}>
            {children}
            <BlueprintDimensions />
          </group>
        </LinearBlendingContext>
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          minDistance={2.2}
          maxDistance={14}
          enableDamping
        />
        <ExplodeController root={modelRoot} />
        <LumeController root={modelRoot} />
        <BlueprintController root={modelRoot} />
        <AudioDriver profile={sound} root={modelRoot} />
        {bloom && <StageBloom settings={bloom} />}
        {stats && <RenderStatsProbe onSample={setSample} />}
      </Canvas>
      {stats && sample && (
        <pre className="render-stats">
          {`${backend}\n${sample.fps} fps · ${sample.calls} calls${sample.dispatches ? ` · ${sample.dispatches} compute` : ''} · ${sample.triangles.toLocaleString()} tris\n${sample.geometries} geometries · ${sample.textures} textures`}
        </pre>
      )}
    </>
  )
}
