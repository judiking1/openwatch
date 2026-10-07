import { GroundShadow } from './GroundShadow'
import { StudioEnvironment } from './StudioEnvironment'

/** Offline studio setup: procedural light boxes only, no HDR downloads; works on both renderers. */
export function StudioLighting({ contactShadows = true }: { contactShadows?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} castShadow />
      <directionalLight position={[-4, -2, 3]} intensity={0.4} />
      <StudioEnvironment />
      {contactShadows && <GroundShadow />}
    </>
  )
}
