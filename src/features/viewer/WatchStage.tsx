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
  type Group,
  type ToneMapping,
} from 'three'
import { StudioLighting } from '../../three/lighting/StudioLighting'
import { RenderStatsProbe, type RenderSample } from '../../three/RenderStats'
import type { ToneMappingName } from './toneMapping'

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
}

export function WatchStage({ children, ref, stats = false, toneMapping = 'aces' }: Props) {
  const [sample, setSample] = useState<RenderSample | null>(null)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const modelRoot = useRef<Group>(null)
  useImperativeHandle(ref, () => ({
    resetCamera: () => controls.current?.reset(),
    getModelRoot: () => modelRoot.current,
  }))

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.5, -1.1, 7.9], fov: 35, near: 0.05, far: 50 }}
        gl={{
          preserveDrawingBuffer: true,
          // Explicit (R3F's implicit default is ACES): highlights on polished metal roll off.
          toneMapping: TONE_MAPPINGS[toneMapping],
          toneMappingExposure: 1,
        }}
      >
        <color attach="background" args={['#0e0f13']} />
        <StudioLighting />
        <group ref={modelRoot} scale={DIAL_UNIT}>
          {children}
        </group>
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          minDistance={2.2}
          maxDistance={14}
          enableDamping
        />
        {stats && <RenderStatsProbe onSample={setSample} />}
      </Canvas>
      {stats && sample && (
        <pre className="render-stats">
          {`${sample.fps} fps · ${sample.calls} calls · ${sample.triangles.toLocaleString()} tris\n${sample.geometries} geometries · ${sample.textures} textures`}
        </pre>
      )}
    </>
  )
}
