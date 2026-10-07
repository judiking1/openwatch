import { useThree } from '@react-three/fiber'
import { Vector2, WebGLRenderer, type ToneMapping } from 'three'
import type { RendererMode } from '../features/viewer/rendererMode'

/** R3F hands the factory its default props; only the canvas matters here. */
type CanvasProps = { canvas: unknown }

export type RendererOptions = {
  toneMapping: ToneMapping
  preserveDrawingBuffer?: boolean
}

/**
 * Renderer factory for R3F's `gl` prop.
 *
 * - `webgl`: the classic `WebGLRenderer` (default; every feature supported).
 * - `webgpu`: three's `WebGPURenderer`, loaded on demand. It uses the WebGPU backend when the
 *   browser offers an adapter and transparently falls back to its own WebGL2 backend
 *   otherwise, so TSL node materials run either way; compute shaders need the WebGPU backend.
 */
let swizzleShimInstalled = false

/**
 * three r186 passes `swizzle: 'rgba'` on every texture view. Chromium ≤ 141 types that member
 * differently and throws. 'rgba' is the identity swizzle, so dropping it is always safe.
 */
function installSwizzleShim() {
  const GPUTextureClass = (globalThis as unknown as { GPUTexture?: { prototype: object } })
    .GPUTexture
  if (swizzleShimInstalled || !GPUTextureClass) return
  swizzleShimInstalled = true
  const proto = GPUTextureClass.prototype as {
    createView: (descriptor?: Record<string, unknown>) => unknown
  }
  const createView = proto.createView
  proto.createView = function (descriptor?: Record<string, unknown>) {
    if (descriptor?.swizzle === 'rgba') {
      const rest = { ...descriptor }
      delete rest.swizzle
      return createView.call(this, rest)
    }
    return createView.call(this, descriptor)
  }
}

/** TSL materials, loaded with `three/webgpu` before a node renderer is handed to R3F. */
export type NodeLibrary = typeof import('./materials/nodeLibrary')
let nodeLibrary: NodeLibrary | null = null

/** The TSL material library, or null on WebGLRenderer (it never loads there). */
export function getNodeLibrary(gl: unknown): NodeLibrary | null {
  return rendererKind(gl).nodes ? nodeLibrary : null
}

export function createWatchRenderer(mode: RendererMode, options: RendererOptions) {
  return async (props: CanvasProps) => {
    if (mode === 'webgpu' || mode === 'webgpu-gl') {
      installSwizzleShim()
      const [{ WebGPURenderer }, library] = await Promise.all([
        import('three/webgpu'),
        import('./materials/nodeLibrary'),
      ])
      nodeLibrary = library
      const renderer = new WebGPURenderer({
        canvas: props.canvas as HTMLCanvasElement,
        antialias: true,
        alpha: true,
        forceWebGL: mode === 'webgpu-gl',
      })
      await renderer.init()
      renderer.toneMapping = options.toneMapping
      renderer.toneMappingExposure = 1
      return renderer
    }
    const renderer = new WebGLRenderer({
      canvas: props.canvas as HTMLCanvasElement,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: options.preserveDrawingBuffer,
    })
    renderer.toneMapping = options.toneMapping
    renderer.toneMappingExposure = 1
    return renderer
  }
}

export type RendererKind = {
  /** A `WebGPURenderer` (either backend): TSL node materials are available. */
  nodes: boolean
  /** Running on the WebGPU backend: compute shaders are available. */
  compute: boolean
  label: string
}

export function rendererKind(gl: unknown): RendererKind {
  const r = gl as { isWebGPURenderer?: boolean; backend?: { isWebGPUBackend?: boolean } }
  if (!r.isWebGPURenderer) return { nodes: false, compute: false, label: 'WebGL' }
  const compute = r.backend?.isWebGPUBackend === true
  return { nodes: true, compute, label: compute ? 'WebGPU' : 'WebGPU renderer · WebGL2 backend' }
}

export function useRendererKind(): RendererKind {
  return rendererKind(useThree((s) => s.gl))
}

type Rect = { x: number; y: number; z: number; w: number }
type ViewportApi = {
  setViewport: (x: number | Rect, y?: number, w?: number, h?: number, ...rest: number[]) => void
  setScissor: (x: number | Rect, y?: number, w?: number, h?: number) => void
  getSize: (target: Vector2) => Vector2
}

/**
 * drei's `<View>` places its viewport and scissor rectangles bottom-up, WebGL's convention.
 * WebGPURenderer measures them top-down (on both of its backends), which mirrors every
 * view vertically. On a node renderer this converts the y of both calls and keeps scissors
 * inside the canvas, as WebGPU requires; WebGL is untouched.
 */
export function bottomLeftViewports(gl: unknown) {
  if (!rendererKind(gl).nodes) return
  const r = gl as ViewportApi & { __bottomLeft?: boolean }
  if (r.__bottomLeft) return
  r.__bottomLeft = true
  const size = new Vector2()
  const flip = (set: (...args: number[]) => void, clampToCanvas: boolean) =>
    function (x: number | Rect, y = 0, w = 0, h = 0, ...rest: number[]) {
      if (typeof x === 'object') ({ x, y, z: w, w: h } = x)
      const { x: width, y: height } = r.getSize(size)
      let top = height - y - h
      if (clampToCanvas) {
        // WebGPU rejects scissor rectangles that leave the canvas (views scrolled away).
        const x0 = Math.min(Math.max(x, 0), width)
        const y0 = Math.min(Math.max(top, 0), height)
        w = Math.max(0, Math.min(x + w, width) - x0)
        h = Math.max(0, Math.min(top + h, height) - y0)
        x = x0
        top = y0
      }
      set(x, top, w, h, ...rest)
    }
  r.setViewport = flip(r.setViewport.bind(r) as (...args: number[]) => void, false)
  r.setScissor = flip(r.setScissor.bind(r) as (...args: number[]) => void, true)
}
