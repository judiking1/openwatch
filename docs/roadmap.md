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

Later: Phase 7 (AI concept pipeline), Phase 8 (Blender assets).

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

## Next candidates

- Remaining proposals in `docs/future-concepts-and-features.md`: blueprint (CAD) mode,
  gyroscope physics, the in-app Prompt-to-Watch generator built on `docs/concept-generator/`,
  snapshot cards.
- Chladni on compute shaders (tens of thousands of grains on the WebGPU backend).
- Visual review pass with real devices; tune lighting and strap geometry.
- Real-device check of `?renderer=auto` before making WebGPU the default
  (`docs/rendering-and-webgpu.md` §9).
- More concepts from the backlog in `docs/research/watch-references.md` (plasma, phase,
  night-only).
- Share links that encode appearance as well as time.
- Phase 7 — AI-assisted concept pipeline (concept document template, review checklist).
