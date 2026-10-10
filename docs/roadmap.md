# Roadmap

Status of the phases defined in `PROJECT_VISION.md` §15.

| Version | Phase                                                                  | Status |
| ------- | ---------------------------------------------------------------------- | ------ |
| 0.1.0   | Phase 0 — Repository bootstrap                                         | done   |
| 0.2.0   | Phase 1 — Orbital Hands time math + 2D SVG prototype                   | done   |
| 0.3.0   | Phase 2 — First 3D watch (React Three Fiber)                           | done   |
| 0.4.0   | Phase 3 — Viewer architecture + concept registry                       | done   |
| 0.5.0   | Additional concepts (Rotating Numeral Ring, Eclipse) + Phase 4 gallery | done   |
| 0.6.0   | Phase 5 — Customization                                                | done   |
| 0.7.0   | Phase 6 — GLB export                                                   | done   |

Phase 7 (AI concept pipeline) landed in 0.17–0.18, Phase 8 (Blender assets) in 0.19.

## MVP status (PROJECT_VISION.md §18)

All MVP criteria are met as of 0.7.x: three selectable concepts, realtime 3D viewer with
orbit/zoom, live and manual time, more than three customisable properties per concept, and
new concepts plug in through the registry. `1.0.0` is reserved for a human review of the MVP.

## 0.8.0 — Reference survey and new concepts

`docs/research/watch-references.md` surveys existing displays, derives difference axes and
rejects ideas that already exist. From its gaps: 004 Shears, 005 Turntable, 006 Cipher.

## 0.10.0 — Second concept round and GLB round-trip

007 Marble, 008 Lens, 009 Optical Lever, 010 Angbuilgu, 011 Jagyeongnu (GPU Navier–Stokes
water). Model Lab (`#/lab/import`) imports GLB and drives `hour` / `minute` / `second` parts;
every concept exports and re-imports cleanly (ADR 0004).

## 0.11.0 – 0.14.0 — Rendering pipeline and WebGPU (docs/rendering-and-webgpu.md §5–7)

Phase A (shared geometry, explicit tone mapping, `?stats`), live gallery, Phase B (dial
masks tinted by material) and Phase C: an experimental `?renderer=webgpu` flag on
`WebGPURenderer` with the GLSL-only features (fluid, fat lines, drei environment and contact
shadows) replaced or ported to TSL, plus the first TSL materials (brushed metal, sapphire).

## 0.15.0 — WebGPU Phase D and readable Joseon dials

Compute-shader fluid, the live gallery on WebGPURenderer (with shader warm-up and adaptive
resolution) and TSL bloom for Optical Lever, all verified on the WebGPU backend itself.
Jagyeongnu and Angbuilgu gained Arabic clock times next to their Hanja.

## 0.16.0 — WebGPU Phase E

Fat lines and bloom on both renderers, `?renderer=auto`, an Angbuilgu reading guide, and the
future-concepts proposals checked against existing watches.

## 0.17.0 — Showcase features, two concepts, sharing and the generator kit

Every task of `docs/future-concepts-and-features.md` §6: exploded view, lume (night) view,
procedural sound; 012 Iris and 013 Chladni (reworked from Magnetic Sand after the precedent
check); share links with appearance; the concept generator kit (`docs/concept-generator/`).

## 0.18.0 — Next candidates: viewer modes, Concept Lab, compute sand, 014 and 015

Blueprint (CAD) view, tilt physics (device gyroscope or the camera's view), the in-browser
Concept Lab (`#/lab/concept`) built on the generator kit, snapshot cards with a QR link,
Chladni sand on compute shaders (32 768 grains on the WebGPU backend), and two concepts from
the research backlog after the precedent check: 014 Plasma and 015 Phase (Night-only was
retired as a standalone concept).

## 0.19.0 — Simulations deepened, Phase 8 Blender assets

Chladni sand piles into a lit heightfield (height grid on CPU and GPU), Phase runs the wave
equation with reflections off the case wall (CPU solver, compute shaders on the WebGPU
backend), Plasma filaments follow a touch, and the shared strap, bracelet, crown and lugs
are modelled in Blender (`blender/generate_assets.py`). A refactor pass shared the random
numbers, clock angles, TSL node typing and test helpers.

## 0.20.0 — Gallery polish, touch, physics and engraved cases

The gallery's live views are centred in their cards and no longer trail behind while
scrolling. Phase takes a touch as a third wave source; Plasma's filaments bend in 3D and
strike with a synced crackle; Chladni sand holds an angle of repose and its grains collide;
the Blender assets gained a coin-edge bezel and an engraved caseback and are
meshopt-compressed. Refactor: shared async GPU resources and touch surface, split Chladni
and Plasma modules.

## Next candidates

Needs the user (cannot be done from the headless sandbox):

- Visual review on real devices: lighting, the Blender strap, bezel, lugs and caseback
  engraving; gallery scrolling smoothness.
- Real-device check of `?renderer=auto` before making WebGPU the default
  (`docs/rendering-and-webgpu.md` §9), the tilt button on phones (gyroscope permission),
  and the frame cost of Phase's and Chladni's solvers on low-end phones.
- Tags: release tags cannot be pushed from the cloud sandbox (see the release notes).

Can be done next:

- Phase: emitters that can be switched off one by one to show how the focus degrades.
- Plasma: branching filaments (short forks that die out in the gas).
- Chladni: sand that spills off the plate edge; per-grain height for true 3D stacking.
- Load the caseback only when the back of the watch is first shown (it is the largest asset).
