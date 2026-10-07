import { useRendererKind } from './renderer'

/**
 * Solid scene background on WebGLRenderer. WebGPURenderer tone-maps the background colour in
 * its output pass (WebGL does not), which crushes a near-black to black; there the canvas
 * stays transparent and the page's identical CSS background shows through instead.
 */
export function StageBackground({ color }: { color: string }) {
  const { nodes } = useRendererKind()
  return nodes ? null : <color attach="background" args={[color]} />
}
