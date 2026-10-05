import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useImperativeHandle, useRef, type ComponentRef, type ReactNode, type Ref } from 'react'
import type { Group } from 'three'
import { StudioLighting } from '../../three/lighting/StudioLighting'

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
}

export function WatchStage({ children, ref }: Props) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const modelRoot = useRef<Group>(null)
  useImperativeHandle(ref, () => ({
    resetCamera: () => controls.current?.reset(),
    getModelRoot: () => modelRoot.current,
  }))

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [1.4, -1.8, 7.6], fov: 35, near: 0.05, far: 50 }}
      gl={{ preserveDrawingBuffer: true }}
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
    </Canvas>
  )
}
