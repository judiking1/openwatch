/** Renderer selectable with `?renderer=` (kept free of three.js imports for the main bundle). */
/**
 * - `webgpu-gl` forces WebGPURenderer onto its WebGL2 backend: same node materials, used to
 *   verify the WebGPU code path where no WebGPU adapter is available.
 * - `auto` uses WebGPURenderer only when the browser hands out a WebGPU adapter, and the
 *   classic WebGLRenderer otherwise (the candidate default once real devices are checked).
 */
export const RENDERER_MODES = ['webgl', 'webgpu', 'webgpu-gl', 'auto'] as const
export type RendererMode = (typeof RENDERER_MODES)[number]

export function parseRendererMode(value: string | null): RendererMode | undefined {
  return RENDERER_MODES.find((mode) => mode === value)
}
