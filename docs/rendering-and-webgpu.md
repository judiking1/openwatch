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
