# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org).

## [0.10.0] - 2026-10-05

### Added

- Watch 007 — Marble: dishes tilt toward the time and marbles roll there under simulated gravity.
- Watch 008 — Lens: the scale swells where the time is (size encoding).
- Watch 009 — Optical Lever: reflected laser beams are the hands; mirrors turn at half speed.
- Watch 010 — Angbuilgu: Joseon concave sundial with a virtual sun over Hanyang — time, 시진,
  24 solar terms and night watches.
- Watch 011 — Jagyeongnu: Joseon water clock (시진 / 각) with water solved by a reusable GPU
  Stable Fluids (Navier–Stokes) solver, `src/three/fluid/StableFluid.ts`.
- Model Lab (`#/lab/import`): load a GLB, see its stats and metadata, and drive parts named
  `hour` / `minute` / `second` with the clock (ADR 0004).
- `WatchCase` `cavityDepth` for recessed dials; `angleDelta` helper; `useClockFrame` passes epoch ms.
- Research: second round of precedents (rejected: petal count, hour bracelet, dual frame).

### Fixed

- GLB export now succeeds for every concept: shaders fall back to standard materials, fat lines
  become line segments, back-face-only surfaces export double-sided, liquid levels are baked.
- Thumbnail capture waits for heavy scenes and can recapture selected watches.

## [0.9.0] - 2026-10-05

### Added

- Stage "How to read" hint per concept (`readingHint` metadata), so rotating-scale watches
  (Fixed Beam, Turntable, Cipher) do not look broken when 12 is not at the top.
- Previous / next navigation on the stage and with the ← / → keys.
- Time panel: scrub-the-day slider, mode badge (live / paused / ×speed), compact time + speed row.
- `parseClock`, `atTimeOfDay`, `secondsOfDay` time helpers with tests.

### Changed

- Refactor: `useClockFrame`, `useDialTexture`, `useDisposable` and canvas `drawTicks` /
  `drawLabels` helpers replace per-concept boilerplate; shared `DIAL_RADIUS`.
- Viewer panel order: title → time → how to read → about → customize → export.
- More frontal default camera; "Reset view" renamed "Front view".

### Fixed

- Opening a `?t=` link froze the clock for the rest of the session; leaving the link now
  returns to live time.
- Cipher rings could be captured mid-spin on load and show mixed glyphs; they now snap to the
  current time on the first frame.

## [0.8.0] - 2026-10-05

### Added

- `docs/research/watch-references.md`: survey of existing watch displays, difference axes,
  ideas rejected because they already exist (shadow gnomons, spirals, moiré, vernier, tactile
  bumps, fluid) and the gaps the new concepts occupy.
- Watch 004 — Shears: hour by the direction of a scissor pair, minutes by its opening angle,
  seconds as a bead sliding along the handles.
- Watch 005 — Turntable: the whole head turns on the strap and is the hour hand; read at a
  fixed index on the strap.
- Watch 006 — Cipher: nine scrambled rings that only form whole numerals in the window at twelve.
- `WatchCase` `headRef` so a concept can move the head separately from lugs and strap.
- Gallery categories Linkage, Kinetic, Experimental; refreshed thumbnails.

## [0.7.3] - 2026-10-05

### Fixed

- Fixed Beam and Eclipse misread the hour after half past (7:45 looked like "8"): both now
  use a jumping hour (`jumpHourAngle`) that frames one whole numeral for the full hour.
- Fixed Beam seconds disc had no scale; it now carries seconds numerals and ticks under the beam.
- Eclipse minutes were unreadable through a round hole showing one tick; the minute disc now
  has a curved window with numerals every five minutes and a centre notch. Seconds get a tick
  ring around the sun.

## [0.7.2] - 2026-10-05

### Added

- GitHub Pages deployment workflow: every push to `main` runs lint, tests and build, then deploys.

### Changed

- Relative Vite `base` so the app works under `/openwatch/`.
- Trunk-based workflow on `main` documented in `AGENTS.md`.

## [0.7.1] - 2026-10-05

### Fixed

- App version label in the top bar was missing.
- Top bar navigation wrapped on narrow screens.

### Docs

- Roadmap: MVP status and next candidates.

## [0.7.0] - 2026-10-05

### Added

- "Download GLB" in the viewer: exports the current configuration and time as a binary glTF
  in metres, with concept metadata and a visual-model disclaimer in the root node extras.
- App version shown in the top bar.
- ADR 0003 (GLB export).

## [0.6.0] - 2026-10-05

### Added

- Concepts declare their customisable fields (`customization`); shared case / crystal /
  strap fields live in `src/three/parts/fields.ts`.
- Customize panel grouped by Case, Dial, Indicators, Crystal and Strap (colour pickers,
  finish sliders, strap style).
- Per-concept appearance overrides persisted in localStorage, with reset.

### Changed

- Side panel scrolls independently of the 3D stage; mobile layout stacks stage and panel.

## [0.5.0] - 2026-10-05

### Added

- Watch 002 — Fixed Beam: numerals rotate beneath a fixed luminous beam.
- Watch 003 — Eclipse: time read through apertures in rotating dark discs over a glowing face.
- Exhibition gallery (home) with thumbnails, metadata badges and category filters.
- `?t=HH:MM:SS` freezes the clock; `&bare` renders only the 3D stage.
- `scripts/capture-thumbnails.mjs` to regenerate gallery thumbnails.

## [0.4.0] - 2026-10-05

### Changed

- Viewer is now generic: `#/watch/:id` renders any concept from the registry.
- three.js and the viewer are lazy-loaded; the main bundle no longer contains them.

### Added

- `WatchConcept` type, `defineConcept` helper and `src/watches/registry.ts`.
- Registry tests and ADR 0002; "Adding a watch concept" guide in `AGENTS.md`.

## [0.3.0] - 2026-10-05

### Added

- Three.js, React Three Fiber and drei.
- Procedural 3D Orbital Hands watch: case, bezel, crown, lugs, curved strap, crystal,
  canvas-textured dial with fixed numerals, orbit tracks and three extruded orbiting indicators.
- Offline studio lighting (procedural light formers, no HDR download).
- 3D viewer at `#/watch/orbital-hands`: orbit camera, zoom, reset view, fullscreen,
  live / manual / accelerated time and concept metadata panel.

## [0.2.0] - 2026-10-05

### Added

- Framework-free dial time math (`handAngles`, `dialPoint`) with unit tests.
- Time controller model: live mode, pause, manual time and speed (×1–×3600) without jumps.
- Orbital Hands 2D SVG logic prototype at `#/lab/orbital-hands-2d` with adjustable
  numeral radius, orbit radii, indicator length and width.
- Minimal hash router and app shell.

## [0.1.0] - 2026-10-05

### Added

- Vite + React + TypeScript project bootstrap.
- `PROJECT_VISION.md`, `AGENTS.md`, roadmap and first concept document.
- oxlint, Prettier and Vitest tooling.
- Initial directory structure.
