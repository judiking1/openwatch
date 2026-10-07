# Future Concepts & Feature Proposals

This document collects architectural proposals, novel horological concepts, and viewer features designed to guide the next phases of **Orbital Watch Lab (`openwatch`)**.

---

## 1. Vision & Background

Orbital Watch Lab exists to answer one question (`PROJECT_VISION.md` §1):

> _How many completely different ways can time be represented on a wristwatch?_

Following the survey in `docs/research/watch-references.md`, a concept is genuinely novel only when it occupies previously under-used or empty cells in the horological difference space (e.g. relative aperture opening, particle physics, floating tensegrity, surface relief).

The proposals below are organized into:

1. **Four Novel Watch Concepts** (012–015)
2. **Three Horology Showcase Features** (Exploded View, Lume Mode, Technical Blueprint)
3. **Sensory Immersion** (Procedural Acoustic Engine, Gyroscope Physics)
4. **AI Generation & Community Sharing** (Phase 7 expansion)
5. **Step-by-step Implementation Tasks for AI Agents**

---

## 2. Four Novel Watch Concepts

### Concept 012 — Iris (Aperture / Origami Mechanism)

- **Concept:** Time displayed through the breathing contraction and rotation of camera-style aperture blades.
- **How time is read:**
  - **Hour:** The absolute rotation angle of the outer blade carrier around the dial (0–360° over 12 hours).
  - **Minute:** The diameter/aperture opening of the central iris. At minute 00, the iris is fully open; over 60 minutes it steadily closes inward towards a tight pinhole aperture.
  - **Retrograde Snap:** At minute 59:59 → 00:00, the blades snap open instantly via a spring-loaded retrograde jump.
- **Axes occupied:**
  - One element carrying two values (rotation = hour, aperture size = minute).
  - Mechanical character: multi-blade linkage with instantaneous retrograde release.
- **3D Implementation:** Procedural overlapping blade geometries with metallic brushed finishes rotating in cylindrical coordinates.

---

### Concept 013 — Magnetic Sand (Ferrofluid / Hourglass Particles)

- **Concept:** A digital hourglass where thousands of micro-particles are governed by virtual magnetic fields to display time.
- **How time is read:**
  - On the hour and minute changes, a cloud of metallic particles flows along magnetic flux lines to coagulate into sharp numerals, or stream down an hourglass neck like digital ferrofluid.
- **Axes occupied:**
  - Particle/fluidic time without solid rigid hands or disks.
  - Dynamic state transition from chaotic fluid to legible typography.
- **WebGPU Technology:**
  - Extends `StableFluidCompute.ts` and the boids simulation from `wass08/under-the-sea`.
  - 8,192–16,384 particles stored in a `StorageBufferAttribute` and simulated on the GPU with compute shaders (`Fn(...).compute(N)`).
  - Fallback for WebGL: Pre-computed path morphing or instanced sprite flow.

---

### Concept 014 — Tensegrity (Levitation / Non-Contact Arbor)

- **Concept:** A watch with no central pivot arbor or visible axle. The indicator rings float in mid-air inside a hollow glass chamber, seemingly held only by micro-wire tension and magnetic repulsion.
- **How time is read:**
  - Two concentric rings (outer = hour, inner = minute) float within a transparent sapphire cylinder.
  - Markers on the rings point towards an index printed on the inner circumference of the case.
  - Micro-oscillations: when the user rotates or tilts the watch, the floating rings gently oscillate with damped harmonic motion before settling.
- **Axes occupied:**
  - Discontinuous physical linkage (virtual magnetic levitation).
  - Floating 3D kinetic sculpture.

---

### Concept 015 — Tactile Topography (3D Relief / Surface Morph)

- **Concept:** A dial composed of a fine grid of mechanical pins (e.g. 32×32 or concentric radial pins) that rise and fall along the Z-axis, forming a dynamic topographic landscape.
- **How time is read:**
  - An elevation wave sweeps radially like a ripple: the crest of the wave indicates the current hour, and a smaller secondary ripple indicates the minute.
  - Shadows cast across the pins under grazing light create legible contrast without any printed numerals.
- **Axes occupied:**
  - Continuous 3D geometric elevation wave as time encoding.
  - Light & shadow interaction with moving topography.

---

### Precedent check (October 2026)

`PROJECT_VISION.md` §21 asks for an originality check before a concept is built. Searched
against the catalogue in `docs/research/watch-references.md`:

| Concept           | Nearest existing references                                                                                                            | Verdict                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 012 Iris          | Valbray EL1 / Leica "Oculus" (16-blade diaphragm hides sub-dials), Tokyoflash iris concept, Pebble "Iris" face                         | **Built as 012 Iris** (`docs/concepts/iris.md`). Existing irises hide or reveal a display; none encodes the minute as the aperture size. |
| 013 Magnetic Sand | Ferrolic (ferrofluid forms numerals), INK-MAGNETIC watch, Robison ferrofluid clock, Moongchi Clock (iron filings mark hour and minute) | **Reworked → built as 013 Chladni:** sand settling on a vibrating plate's still lines (`docs/concepts/chladni.md`).                      |
| 014 Tensegrity    | Mystery / floating-hand dials (Cartier, Longines), Ressence floating discs                                                             | **Weak.** "Hands without a visible arbor" is already catalogued. Only the damped wobble is new, which is not a way of telling time.      |
| 015 Topography    | Relevo, Eone Bradley — listed under "rejected because they already exist"                                                              | **Rejected** (already rejected in the survey, §3).                                                                                       |

Iris is the strongest next concept; Magnetic Sand stays the best showcase for compute
shaders if its encoding is reworked. Sources: [Valbray × Leica](https://petapixel.com/2014/05/22/leica-teams-swiss-watch-maker-valbray-insanely-unique-timepiece),
[Tokyoflash iris](https://blog.tokyoflash.com/2013/07/26/watch-design-inspired-by-a-camera-iris/),
[Ferrolic](https://www.dezeen.com/?p=756566),
[INK-MAGNETIC](https://www.yankodesign.com/2021/01/06/this-magnetic-ink-watch-makes-the-journey-of-time-much-more-visually-interesting/amp/),
[floating hands](https://barringtonwatchwinders.com/pages/mystery-dial),
[Ressence](https://www.phillips.com/detail/ressence/171995).

---

## 3. Horology Showcase Features (Viewer Polish)

### 3.1 Exploded View (Layer Breakdown)

- **Goal:** Allow visitors to pull apart the watch along the Z-axis to inspect its layered construction (sapphire crystal, bezel, hands/rings, dial print layer, dial base, internal movement plate, caseback).
- **Architecture:**
  - Introduce an `explodedProgress` parameter (0 = normal, 1 = fully exploded) in `WatchStage`.
  - Parts declare a target displacement: `zOffset = explodedZ * explodedProgress`.
  - Controlled by a smooth slider or toggle button in the stage toolbar.

### 3.2 Lume Check / Night Mode (Super-LumiNova View)

- **Goal:** Experience the watch in pitch darkness, evaluating the phosphorescent lume glow.
- **Architecture:**
  - Toggle button (`🌙 Lume`) in the stage toolbar.
  - Smoothly fades `StudioLighting` intensity to 0.
  - Boosts `emissiveIntensity` of luminous materials (hands, markers, Eclipse glow, Optical Lever lasers) and reuses the stage bloom (`postFx.bloom` → `StageBloom`, on both renderers since v0.16.0).

### 3.3 Blueprint / Technical CAD Mode

- **Goal:** Render the watch as a precision industrial engineering blueprint.
- **Architecture:**
  - Wireframe overlay on geometries.
  - Overlay 3D dimension calipers (e.g. `40.0 mm case`, `DIAL_RADIUS = 100`, angle markers).
  - High-contrast blueprint color palette (cyan wireframes on dark navy background).

---

## 4. Sensory Immersion: Sound & Physics

### 4.1 Procedural Mechanical Sound Engine (Web Audio API)

- **Goal:** Real mechanical watches are defined by their sound (escapement ticking, rotor whoosh, jumping hour snaps, clepsydra drops).
- **Architecture:**
  - Create `src/features/audio/WatchAudioEngine.ts` using native Web Audio API oscillators and noise buffers (zero external audio asset downloads):
    - **Escapement Tick:** BPH selector (21,600 bph = 6 ticks/sec, 28,800 bph = 8 ticks/sec).
    - **Jumping Snaps:** Crisp metallic transient on jumping hour transitions (Eclipse, Iris).
    - **Fluid Foley:** Soft water droplet pings for Jagyeongnu.
    - **Spatial Audio:** Volume attenuates as camera zooms out; increases when viewing the open caseback.
    - Mute button on topbar / stage toolbar.

### 4.2 Device Gyroscope & Physical Inertia

- **Goal:** Make free-floating elements (Marble rolling spheres, automatic winding rotor, Tensegrity rings) respond to real-world device tilting.
- **Architecture:**
  - Hook into `DeviceOrientationEvent` (on mobile) and mouse drag velocity (on desktop).
  - Pass a dynamic gravity vector `vec3(gx, gy, gz)` into physics and pose calculations.

---

## 5. Phase 7: AI Watch Lab & Community Features

### 5.1 "Prompt-to-Watch" Concept Generator

- A conversational or form-based prompt interface (`#/lab/generator`):
  - User inputs a prompt (e.g. _"A watch inspired by black hole accretion disks and orbital gravity lensing"_).
  - An LLM agent generates:
    1. Metadata (`name`, `tagline`, `readingHint`, `category`, `origin: 'ai'`).
    2. Mathematical formulas for indicator positions (`geometry.ts`).
    3. Customization schema and color palette (`appearance.ts`).
    4. Procedural 3D R3F Model combining standard parts (`WatchCase`, `Crystal`, `PrintLayer`) with procedural meshes.
  - Dynamically previewed in the live `WatchStage`.

### 5.2 Shareable Config URLs & Export Cards

- **Deep-link state:** Encode custom appearance overrides and frozen timestamps into a compact URL hash:
  `/#/watch/cipher?a=0.8,c9a96e,1&t=10:10:00`.
- **Snapshot Card:** One-click generation of a branded PNG card with the rendered 3D watch, watch number, specs, and QR code to view the live model.

---

## 6. Implementation Task Roadmap for AI Agents

Status as of v0.17.0: every task below is done. The rendering groundwork these features need now exists: bloom on
both renderers, compute shaders on the WebGPU backend, and the reading-aid pattern (Angbuilgu
guide).

```
[Phase 1: Viewer Polish & Showcase]
├── Task 1.1: Exploded View slider in WatchStage & WatchCase — done
├── Task 1.2: Lume Check (Night Mode) toggle — done
└── Task 1.3: Web Audio API procedural mechanical tick-tock engine — done

[Phase 2: Next Novel Concepts]
├── Task 2.1: Concept 012 — Iris — built
└── Task 2.2: Concept 013 — reworked and built as Chladni

[Phase 3: AI Lab & Sharing]
├── Task 3.1: Deep-link URL encoding for appearance customization — done (`?a=`, Copy link)
└── Task 3.2: Concept generator schema and prompt template — done (`docs/concept-generator/`)
```
