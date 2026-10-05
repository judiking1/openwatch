import { ContactShadows, Environment, Lightformer } from '@react-three/drei'

/** Offline studio setup: procedural light formers only, no HDR downloads. */
export function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} castShadow />
      <directionalLight position={[-4, -2, 3]} intensity={0.4} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-5, 0, 2]} scale={[2, 8, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[5, 0, 2]} scale={[2, 8, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, -3, 5]} scale={3} />
        <Lightformer form="rect" intensity={0.6} position={[0, 0, -6]} scale={[10, 10, 1]} />
      </Environment>
      <ContactShadows position={[0, -2.9, 0]} opacity={0.4} scale={8} blur={2.5} far={4} />
    </>
  )
}
