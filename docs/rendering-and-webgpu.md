# Rendering Architecture & WebGPU Readiness

This document outlines structural refactoring recommendations for the current Three.js / React Three Fiber (R3F) rendering pipeline, along with the foundation needed to transition to WebGPU in future phases.

---

## 1. Executive Summary

The project has a solid foundation: concepts are self-contained in `src/watches/<id>/`, time math is isolated and unit-tested, and appearance is reactive.

However, the 3D rendering pipeline currently relies on early-stage prototype patterns:

1. **CPU-bound 2D Canvas textures**: Dials and rings render 2048x2048 bitmaps on every appearance change.
2. **Material and geometry duplication in JSX loops**: Straps and rings create multiple identical instances, inflating draw calls and memory.
3. **Per-frame allocations**: Animation loops (`useClockFrame`) allocate arrays and objects during every tick.
4. **Hardcoded WebGL Canvas**: No abstraction for WebGPU initialization or fallback.

Preparing for WebGPU now ensures seamless adoption of advanced horology rendering (anisotropic brushed metals, sapphire AR coatings/dispersion, procedural dial markings) without disruptive architectural rewrites.

---

## 2. Immediate Refactoring Candidates

### 2.1 Deduplicate Geometries and Materials in JSX Loops

- **Location**: `src/three/parts/WatchCase.tsx`, `src/watches/orbital-hands/OrbitalHandsWatch.tsx`
- **Issue**:
  - `WatchCase.tsx` renders 14–15 strap segments per side (30 total) inside loops, calling `strapMaterial(...)` and instantiating `<boxGeometry>` on each iteration.
  - Lugs repeat 4 separate `<boxGeometry>` and material instances.
  - `OrbitalHandsWatch.tsx` loops over 3 tracks, creating duplicate `<meshStandardMaterial>` instances.
- **Solution**:
  - Instantiate shared materials and geometries once (or memoize with `useDisposable` / `useMemo`).
  - For strap segments and lugs, evaluate merging into single static geometries or using `instancedMesh`.

### 2.2 Eliminate Per-Frame Allocations in `useClockFrame`

- **Location**: `src/watches/cipher/CipherWatch.tsx`, `src/watches/shears/ShearsWatch.tsx`
- **Issue**:
  - `CipherWatch.tsx` invokes `RINGS.map(...)` and `cipherValues(t)` every frame (60–120 times/sec), allocating new arrays and objects that trigger garbage collection (GC) pauses.
  - `shearsPose(t)` creates a new pose object on every tick.
- **Solution**:
  - Pre-allocate scratch arrays / typed buffers and mutate values in place inside the frame callback.

### 2.3 Decouple Dial Markings (Pattern) from Color Tinting

- **Location**: `src/three/utils/dial.ts`, `src/three/utils/canvas.ts`, concept watch components
- **Issue**:
  - Changing a color in the customization panel triggers `useDialTexture` re-execution, re-rasterizing the 2D canvas at 2048x2048 and re-uploading a new `CanvasTexture`.
  - In `CipherWatch`, 9 separate 1024x1024 canvas textures are created and re-uploaded on color changes.
- **Solution**:
  - Render dial markings as monochrome alpha masks (white on transparent) once.
  - Apply user-customized colors via material properties (`color`, `emissive`) or shader uniforms.
  - Texture regeneration will only occur when layout/geometry changes, not on color slider drags.

### 2.4 Modern Tone Mapping & Physical Camera Setup

- **Location**: `src/features/viewer/WatchStage.tsx`
- **Issue**:
  - `<Canvas>` currently does not specify `toneMapping` or `toneMappingExposure`.
  - Metallic specular highlights on bezels and crystals can clip or wash out.
- **Solution**:
  - Add explicit tone mapping: `toneMapping: AgXToneMapping` (or `ACESFilmicToneMapping`) with calibrated exposure (e.g., `toneMappingExposure: 1.0`).

---

## 3. WebGPU Transition Strategy

Three.js `v0.186.x` already includes `three/webgpu` (`WebGPURenderer`) and TSL (Three Shading Language). The roadmap for adopting WebGPU:

### 3.1 Renderer Abstraction & Automatic Fallback

WebGPU is not yet universally supported across all mobile browsers and legacy systems.

- Create an asynchronous renderer factory (e.g. `src/three/renderer.ts`) passed to R3F's `<Canvas gl={createWatchRenderer}>`:
  - Detect `navigator.gpu`.
  - If available, initialize `WebGPURenderer({ canvas, forceWebGL: false })`.
  - If unavailable or initialization fails, fall back to WebGL2 (`forceWebGL: true` or `WebGLRenderer`).
  - Handle asynchronous initialization (`await renderer.init()`).

### 3.2 Transition from Canvas2D Bitmaps to TSL / Procedural Shaders

- High-end watch visualization benefits immensely from WebGPU compute and procedural fragment shaders:
  - **SDF (Signed Distance Fields)** for dial tick marks, sub-dials, and track rings: infinitely sharp at any zoom distance with zero texture memory.
  - **MSDF (Multi-channel Signed Distance Field)** for numerals instead of canvas font rasterization.
  - **TSL NodeMaterials**: Replace static materials with node-based materials (`MeshStandardNodeMaterial`) for realistic watch finishes:
    - Radial/linear anisotropic roughness for brushed bezels and crowns.
    - Thin-film iridescence and dispersion for sapphire crystal antireflection.
    - Physical phosphorescent bloom for luminous hands (Super-LumiNova).

### 3.3 GLTF / GLB Export Safety (`exportGlb.ts`)

- `GLTFExporter` relies on standard Three.js PBR properties.
- When introducing TSL NodeMaterials or WebGPU shaders, ensure models maintain standard PBR fallback representations so that 3D model exports (`exportWatchGlb`) remain 100% compliant with standard glTF specifications.

---

## 4. Suggested Implementation Phases

1. **Phase A (Low Risk — Immediate Refactoring)**:
   - Deduplicate geometries & materials in `WatchCase.tsx` and watch models.
   - Zero-allocation refactor for `useClockFrame` callbacks.
   - Configure `AgXToneMapping` in `WatchStage.tsx`.

2. **Phase B (Texture & Memory Optimization)**:
   - Separate monochrome dial texture generation from color tinting.
   - Consolidate ring textures in `CipherWatch`.

3. **Phase C (WebGPU Experimental Flag)**:
   - Introduce `createWatchRenderer` with WebGPU support & WebGL2 fallback.
   - Test R3F v9 compatibility with `WebGPURenderer`.
   - Prototype first TSL shader for brushed metal or sapphire dispersion.

---

## 5. Phase A review (v0.11.0)

Measured with the new `?stats` overlay (`window.__owlStats`): draw calls and triangles of a
whole frame, including shadow-map, contact-shadow and fluid passes; headless Chromium /
SwiftShader at `?t=10:08:37`.

| Concept       | Draw calls before | after | Geometries before | after |
| ------------- | ----------------: | ----: | ----------------: | ----: |
| Orbital Hands |               120 |    72 |                67 |    35 |
| Cipher        |               125 |  ~80¹ |                83 |    51 |
| Lens          |               508 |   106 |               204 |    54 |
| Angbuilgu     |               127 |    79 |                85 |    53 |
| Jagyeongnu    |               152 |    99 |                71 |    39 |

¹ Cipher varies between 77 and 98 calls depending on which rings are mid-turn.

### 2.1 Deduplicate geometries and materials — **done**

- `WatchCase`: one shared material per finish (`metal`, `metalInside`, strap); the 30 strap
  segments are merged into one geometry per side and the 4 lugs into one
  (`BufferGeometryUtils.mergeGeometries`). Merged rather than instanced so GLB exports stay
  plain meshes that every viewer understands.
- Lens: 60 minute bars and 60 second dots are two `InstancedMesh`es (−80 % draw calls).
  Instancing exports via `EXT_mesh_gpu_instancing` (verified).
- Orbital Hands: the three tracks and the centre cap share one material.

### 2.2 Per-frame allocations — **done where they scale with a loop**

- Cipher: ring targets are a precomputed `TARGETS[ring][value]` table; the frame callback no
  longer maps arrays.
- Lens: 120 instance matrices are composed into reused scratch objects; positions are
  precomputed.
- Angbuilgu: `shadowOnSphere` takes an `out` vector; the 24-sample needle shadow is cast into
  scratch objects.
- **Kept on purpose:** the handful of small objects per frame from `handAngles`,
  `clockTimeFromMs` and `shearsPose`. They are constant-size, short-lived (young-generation
  GC) and keeping the pure time math return-by-value keeps it simple to test. Revisit only if
  a profile shows GC pauses (PROJECT_VISION.md §22: optimise after measuring).

### 2.4 Tone mapping — **made explicit, ACES kept as default**

R3F already applied `ACESFilmicToneMapping` implicitly, so highlights were not unmapped.
Side-by-side captures (`?tone=aces|agx|neutral`, kept as a look-development switch) showed:

- **AgX** desaturates the gold cases, Eclipse glow and laser colours into muddy browns with
  the current palette and exposure; adopting it needs an exposure / palette retune.
- **Neutral** keeps hues truest and is the most saturated.
- **ACES** is the balanced choice for now and is set explicitly in `WatchStage`.

### Findings for Phase B / C

- **2.3 masks + tint** is worth doing next: colour pickers fire continuously and every change
  re-rasterises 2048² canvases (9 × 1024² for Cipher). Dials that combine a background with
  markings need two layers (background = material colour, markings = alpha mask × tint).
- **WebGPU blockers** to plan for before a `createWatchRenderer` flag:
  - `StableFluid` (Jagyeongnu) uses GLSL `RawShaderMaterial` + `WebGLRenderTarget`; it needs a
    TSL / compute port.
  - drei `<Line>` (Angbuilgu) uses `LineMaterial` (a `ShaderMaterial`); drei
    `ContactShadows` and the Lightformer environment must be verified under `WebGPURenderer`.
  - `prepareForExport` already maps `ShaderMaterial`s to standard PBR for GLB; NodeMaterials
    will need the same fallback (`isNodeMaterial` → `MeshStandardMaterial`).

---

## 6. Phase B review (v0.13.0)

### 2.3 Dial markings as masks, colour as material — **done**

Every dial now separates **pattern** from **colour**:

- Markings are drawn once as white-on-transparent masks (`useDialTexture(extent, draw, [])`,
  `useLabelMasks`) and shown with `PrintLayer` (`src/three/parts/PrintLayer.tsx`), whose
  material colour is the tint. Backgrounds are plain material colours on the base mesh.
- Multi-colour prints are split into layers (Shears scale + gold tip; Eclipse glow face +
  hot-centre mask + markers). Fixed-colour art (Jagyeongnu plaque border and characters) stays
  in its own texture keyed only by content (시진), with the plaque colour as the base.
- Measured by simulating ten picks on every colour field of every watch
  (`window.__owlRaster` counts canvas rasterisations):

| Watch      | Rasterisations before | Megapixels before | after |
| ---------- | --------------------: | ----------------: | ----: |
| Shears     |                    40 |             167.8 |     0 |
| Turntable  |                    40 |             167.8 |     0 |
| Cipher     |                    90 |              94.4 |     0 |
| Lens       |                   240 |               3.9 |     0 |
| Angbuilgu  |                   150 |              44.2 |     0 |
| all others |                 20–30 |            84–126 |     0 |

### Consolidate Cipher ring textures — **done**

Nine 1024² band textures became one 2048² atlas drawn in dial space; each ring uses a
`planarUV` ring geometry into it and all nine share one material. The nine per-ring
background meshes were dropped (the dial base already has that colour): Cipher went from
17 to 9 live textures and fewer draw calls.

### Notes

- Tints multiply the mask, so masks are pure white; anti-aliased edges keep their alpha.
- GLB export is unchanged: masks are ordinary textures with a material colour factor.

---

## 7. Phase C review (v0.14.0) — WebGPU experimental flag

### Renderer flag — **done**

`?renderer=` selects the renderer (`src/three/renderer.ts`, `createWatchRenderer`, passed to
R3F's async `gl` factory):

| Value       | Renderer                                | Use                                         |
| ----------- | --------------------------------------- | ------------------------------------------- |
| `webgl`     | classic `WebGLRenderer` (default)       | production                                  |
| `webgpu`    | `WebGPURenderer`, WebGPU backend if any | the experiment; falls back to WebGL2 itself |
| `webgpu-gl` | `WebGPURenderer` forced onto WebGL2     | testing the node path without a GPU adapter |

- `three/webgpu` and every TSL material are one lazy chunk (`materials/nodeLibrary.ts`,
  ~705 kB / 198 kB gzip), loaded before the renderer is handed to R3F. The WebGL path never
  downloads it; the entry chunk stays at 247 kB.
- `rendererKind(gl)` → `{ nodes, compute, label }`; the `?stats` overlay shows the backend first.
- **R3F v9 works with `WebGPURenderer` unchanged** (async `gl`, `await renderer.init()`):
  `useFrame`, `<View>`-free stage, OrbitControls, shadows, the GLB exporter.
- three r186 passes `swizzle: 'rgba'` to every `GPUTexture.createView`; Chromium ≤ 141
  rejects it. A tiny shim drops that identity swizzle.

### WebGPU blockers — **resolved**

| Blocker (from §5)                          | Resolution                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| drei `<Environment>` + `<Lightformer>`     | `StudioEnvironment`: the same light boxes baked once through PMREM — classic generator on WebGL, node generator on WebGPU                                          |
| drei `<ContactShadows>`                    | `GroundShadow`: a static radial blob. ContactShadows re-rendered the whole model every frame                                                                       |
| `StableFluid` GLSL (Jagyeongnu)            | `StableFluidTSL`: the same Stam passes written in TSL (`QuadMesh` + half-float `RenderTarget`s); the water shader became a `MeshBasicNodeMaterial` (`waterTSL.ts`) |
| drei `<Line>` / `LineMaterial` (Angbuilgu) | `parts/Lines.tsx`: fat lines on WebGL, hairline `LineSegments` on the node renderer                                                                                |
| GLB export of node materials               | `prepareForExport`: `isNodeMaterial` → `MeshStandardMaterial` (colour, metalness, roughness, map or `userData.exportColor`); unit tested                           |

A side effect on WebGL: without ContactShadows' extra model pass, a frame costs far fewer
draw calls (Orbital Hands 53 → 25, Lens 85 → 41).

### First TSL materials — **done**

- **Brushed metal** (`materials/brushedMetal.ts`, the case on the node renderer): two octaves
  of `mx_noise_float` stretched ~12× across the grain along each part's u direction (around the
  case wall and bezel, straight across flat rings); grain modulates roughness more than colour.
  Colour and roughness still come from the material, so the customization panel is unchanged.
- **Sapphire** (`materials/sapphire.ts`, the crystal): coverage follows Schlick's Fresnel
  term — almost clear head-on, mirror-like at grazing angles — instead of one flat opacity.

### Findings

- **Linear blending.** `WebGPURenderer` renders into a linear half-float framebuffer and
  tone-maps / encodes in an output pass; WebGL blends after sRGB encoding. The same opacity
  therefore reads ~4× stronger on WebGPU (the 12 % crystal became a grey veil). Translucent
  layers on the node path use linear-light opacities (sapphire, Jagyeongnu's glass front).
- **Backgrounds are tone-mapped** by that output pass, crushing `#0e0f13` to black; the stage
  leaves the canvas transparent on the node renderer and lets the identical CSS colour show.
- **GLSL `ShaderMaterial`s write raw values** (no tone mapping, no sRGB encoding). Their TSL
  ports set `toneMapped: false` and pre-decode with `sRGBTransferEOTF` to look the same.
- **Draw-call counters differ:** the node renderer counts its internal passes (fluid passes,
  output pass), so `?stats` numbers are not comparable across renderers.
- **Verification limits here:** headless SwiftShader exposes a WebGPU adapter but loses the
  device on first use, so the WebGPU backend itself could only be checked on real hardware.
  All 11 concepts were verified on `?renderer=webgpu-gl` (same node materials, WGSL swapped
  for GLSL) with no console errors, plus GLB export on that path and a WebGL regression pass.

### Reference: wass08/under-the-sea (WebGPU + TSL boids)

- **Source:** [wass08/under-the-sea](https://github.com/wass08/under-the-sea) & YouTube [N1rIC35MDjw ("Make it better" doesn't work. The right words do.)](https://www.youtube.com/watch?v=N1rIC35MDjw).
- **Core Video Insight ("The right words do"):** AI coding agents excel when prompted with precise domain engineering terminology (e.g., GPGPU boids, instancing, indirect draw, TSL nodes, SDF raymarching) rather than vague requests.
- **Architectural Takeaways:**
  - **Init:** `new WebGPURenderer()` → `await init()` → check `backend.isWebGPUBackend` — our `rendererKind().compute` is that check.
  - **GPGPU with compute:** 16,384 fish as `instancedArray` storage buffers updated by `Fn(...).compute(N)` + `renderer.compute()`, a uniform grid built with atomics for neighbour search.
  - **Novel Watch Concept Inspirations:**
    1. _Magnetic Sand Watch:_ Thousands of microscopic metallic particles simulated on the GPU via compute shaders to form numerals or fluid hourglass flows.
    2. _Fluidic Capillary Watch:_ Real-time micro-fluidics simulation in capillary tubes for displaying hours and minutes (HYT style).
    3. _Mechanical Swarm Watch:_ Flocking arrays of micro-reflectors that align to reflect light into legible time figures.
  - **AgX needs darker base colours** (3–5× lower) — the same reason `?tone=agx` looked washed out in Phase A: adopting AgX means retuning palettes, not just switching the operator.
  - **`compileAsync` + warm-up frames** and **adaptive resolution** (lower DPR when fps drops) — both implemented in Phase D below.
  - **Post-processing as a node graph** (`RenderPipeline`, `pass()`, bloom) replaces `EffectComposer`.

---

## 8. Phase D review (v0.15.0) — compute, gallery and post-processing on WebGPU

### Verifying the real WebGPU backend

Phase C could only test the node path on WebGPURenderer's WebGL2 backend. The cause turned
out to be narrow: in this headless sandbox, compute and off-screen rendering work, and only
**presenting to a canvas** loses the device. The test harness (scratch, not shipped) swaps
the canvas swap chain for an ordinary GPU texture and reads it back, so every result below
was checked on the WebGPU backend itself (WGSL), not only on the fallback.

### 1. Compute-shader fluid — **done**

`StableFluidCompute` keeps velocity, dye and pressure in storage buffers (`instancedArray`)
with one thread per cell, and runs a whole step as two `compute()` submissions. A last kernel
publishes dye and velocity to storage textures, so the water material is unchanged. Jagyeongnu
picks it when `rendererKind().compute` is true.

Checked against the full-screen-pass solver with identical splats (64 × 200 grid):

| Field / case                       | Quad passes | Compute     |
| ---------------------------------- | ----------- | ----------- |
| velocity, 120 steps (Σ \|v\|)      | 35 003      | 34 997      |
| dye under force, 20 steps (Σ, row) | 1 311, 71.6 | 1 311, 71.6 |
| 60 steps, SwiftShader              | 1 298 ms    | 468 ms      |

The comparison also exposed a real bug in the Phase C TSL solver: velocity and dye shared one
advection material, and re-binding its textures for the second draw in the same frame did not
take effect — the dye was never advected (fixed with a material per field). The GLSL solver
used on WebGL was not affected.

### 2. Live gallery on WebGPURenderer — **done**

- `?renderer=webgpu` now applies to the gallery too.
- **Viewport origin:** WebGPURenderer measures `setViewport` / `setScissor` from the top
  (on both of its backends); WebGLRenderer, and therefore drei `<View>`, from the bottom.
  Unadapted, every card drew in the mirrored row. `bottomLeftViewports(gl)` converts them.
- **Scissors must stay inside the canvas** on WebGPU (WebGL tolerates rectangles of cards
  scrolled away); the adapter clamps them.
- **Transparent overlays must not write depth:** label planes in Lens, Numeral Ring and
  Turntable were `transparent` with depth writes, hiding the crystal drawn after them. On
  WebGPU's draw order that showed as grey squares in the gallery; they now set
  `depthWrite={false}` like every other print layer.

### 3. Warm-up and adaptive resolution — **done**

Each live view runs `compileAsync(scene, camera)` (parallel compile on WebGL, async pipeline
creation on WebGPU) and only then becomes visible and hides the card's still image
(`data-live`). drei `PerformanceMonitor` steps the layer's DPR between 1.5, 1 and 0.75.

### 4. Bloom as a node graph — **done**

Concepts may request `postFx.bloom`. On a node renderer the stage renders through a TSL
`RenderPipeline`: scene pass → `BloomNode` → added back → tone mapping and encoding once at
the end. The threshold (1.2) is in linear HDR, above anything lit, so only the unlit laser
beams of Optical Lever glow. WebGL ignores the request; the pipeline ships in the lazy chunk.

### 5. Viewer toolbar and stage warm-up (contributed)

- **Stage toolbar:** one-click `WebGL` / `⚡ WebGPU` and `Stats` toggles (they rewrite the
  `?renderer=` / `?stats` query), so visitors can compare renderers without editing URLs.
- **Stage warm-up:** `WatchStage` compiles the scene on creation (`compileAsync` where
  available, `compile` otherwise); failures are non-fatal.
- The gallery briefly used drei `<AdaptiveDpr>`; it only reacts to `performance.regress()`
  calls (from interactive controls), which the non-interactive gallery never makes, so the
  merged version keeps the fps-driven `PerformanceMonitor` above.

### Other fixes

- `?stats` on WebGPURenderer reported a cumulative counter; it now shows the frame's draw
  calls (`info.render.drawCalls`) and compute submissions.

### Next steps (Phase E candidates)

1. Check `?renderer=webgpu` on real devices (Chrome/Edge desktop, Safari 26, Android), then
   consider it as the default with WebGL as the fallback.
2. Fat engraved lines on WebGPU with `Line2NodeMaterial` (now exported by `three/webgpu`)
   instead of hairlines.
3. Selective bloom through MRT (`mrt({ output, bloom })`) so emitters opt in explicitly.
4. A WebGL bloom equivalent, if the glow should be the default look and not a WebGPU extra.

---

## 9. Phase E review (v0.16.0)

### Fat lines on WebGPU — **done**

`parts/Lines` now draws `LineSegments2` with `Line2NodeMaterial` (from the lazy node library)
on WebGPURenderer instead of hairlines, so Angbuilgu's engraved grid and needle keep their
widths on both renderers, in the viewer and in the live gallery.

### Bloom on both renderers — **done**

`postFx.bloom` is no longer WebGPU-only. `StageBloom` renders through the TSL pipeline on a
node renderer and through an `EffectComposer` + `UnrealBloomPass` (a lazy 19 kB chunk) on
WebGL, both with the same linear-HDR threshold. The laser glow is now the default look.

Routing WebGL through a half-float composer brings the linear-blending effect from §7 to WebGL
too: the crystal turned into a grey veil. `LinearBlendingContext` / `useLinearBlending()`
now mark every stage that blends in linear light (node renderer or HDR post chain), and the
crystal and Jagyeongnu's glass use `LINEAR_OPACITY` there.

### Selective (MRT) bloom — **shelved**

The plan was `mrt({ output, glow })` with emitters opting in through `material.mrtNode`.
`mrtNode` does reach the auto-converted classic materials, but in this sandbox the MRT pass
showed no glow even with the mask forced to 1, and the test size later turned out to hide
weak glows too. The result is inconclusive, and the threshold already isolates the
unlit emitters, so this waits until a concept needs per-mesh selection.

### `?renderer=auto` — **groundwork for the default**

`auto` asks for a WebGPU adapter and uses WebGPURenderer only when one is returned; otherwise
WebGLRenderer (checked both ways). The default stays `webgl` until `?renderer=webgpu` or
`auto` has been checked on real devices.

### Angbuilgu reading guide

Not a rendering change, but verified with the same tooling: the shadow tip lands on the right
hour line at 07:00, 09:00, 12:00, 15:45 and the moon bead on 二更 at 22:00. A dotted guide now
follows the current hour line from the tip to the hour numbers (see `docs/concepts/angbuilgu.md`).

### Next steps

1. Real-device check of `?renderer=auto`, then switch the default.
2. Showcase features from `docs/future-concepts-and-features.md` (exploded view, lume mode
   reusing `StageBloom`, audio) — done in v0.17.0.
3. Concept 012 Iris (passed the precedent check) — done in v0.17.0.

## 10. v0.18.0 notes

### Chladni sand on compute shaders — **done**

`chladni/sandCompute.ts` keeps 32 768 grains in a storage buffer (`instancedArray`) and
steps them with a TSL kernel that mirrors the CPU `stepSand` (energy gradient, kick, tilt
slide, reflection at the rim; a hash replaces the random numbers). The instanced grain mesh
reads the same buffer in its vertex stage through a **read-only** storage view
(`storage(...).toReadOnly()`): a read-write binding is not allowed in the vertex stage, and
without it the grains silently did not draw. Verified off-screen on the WebGPU backend:
after settling, mean energy 0.034 (GPU) vs 0.032 (CPU, 4 000 grains), no NaNs. WebGL and
WebGPU-on-WebGL2 keep the CPU model.

### New concepts on both renderers

014 Plasma (per-frame ribbon geometry, instanced phosphor tiles with instance colours) and
015 Phase (per-frame `DataTexture` waves) use classic materials only and were checked on
WebGL and the WebGPU backend. Both drive bloom with unlit HDR colours (`toneMapped={false}`,
colours scaled above 1) so that only the glowing parts cross the threshold.
