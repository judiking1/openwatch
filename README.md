# Orbital Watch Lab

A 3D exhibition and experimentation app for inventing, visualizing and customizing
unconventional watch concepts.

> 시계 바늘이 중앙에 없다면? — 시간을 표현하는 새로운 방법을 실험하는 3D 시계 연구소.

- Vision: [`PROJECT_VISION.md`](./PROJECT_VISION.md)
- Roadmap: [`docs/roadmap.md`](./docs/roadmap.md)
- Concepts: [`docs/concepts/`](./docs/concepts)
- Changes: [`CHANGELOG.md`](./CHANGELOG.md)
- Agent rules: [`AGENTS.md`](./AGENTS.md)

## What works today

- Exhibition of eleven experimental watches, from **Orbital Hands** to a Joseon **Angbuilgu**
  sundial and a **Jagyeongnu** water clock with GPU-simulated water.
- Real-time 3D viewer: orbit, zoom, reset view, fullscreen.
- Time control: live clock, pause, set time, speed ×1 – ×3600. `?t=HH:MM:SS` freezes a time.
- Per-concept customization (case metal and finish, dial, indicators, crystal, strap), saved locally.
- GLB export of the current configuration (visual model only) and GLB import (`#/lab/import`)
  that drives parts named `hour` / `minute` / `second` with the clock.
- 2D logic lab for Orbital Hands at `#/lab/orbital-hands-2d`.

## Stack

Vite · React · TypeScript · Three.js · React Three Fiber · drei · Zustand

## Scripts

```bash
npm install
npm run dev          # dev server
npm run build        # typecheck + production build
npm test             # unit tests (vitest)
npm run lint         # oxlint
npm run format       # prettier
```

## Deployment

Every push to `main` is built and deployed to GitHub Pages by
`.github/workflows/deploy.yml` (lint → test → build → deploy):
<https://judiking1.github.io/openwatch/>

## Versioning

The project uses [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`).
Each roadmap milestone bumps `MINOR` while in `0.x`; fixes bump `PATCH`.
Every release is recorded in `CHANGELOG.md` and tagged in Git as `vX.Y.Z`.
