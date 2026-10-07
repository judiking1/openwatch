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
