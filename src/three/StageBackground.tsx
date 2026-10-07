import { useRendererKind } from './renderer'

type Props = { color: string; transparent?: boolean }

/**
 * Solid scene background on WebGLRenderer. WebGPURenderer tone-maps the background colour in
 * its output pass (WebGL does not), which crushes a near-black to black; there the canvas
 * stays transparent and the page's identical CSS background shows through instead. Post
 * effects tone-map in their output pass too, so `transparent` does the same on WebGL.
 */
export function StageBackground({ color, transparent = false }: Props) {
  const { nodes } = useRendererKind()
  return nodes || transparent ? null : <color attach="background" args={[color]} />
}
