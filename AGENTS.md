# Agent Guide

Read before working on this repository.

1. `PROJECT_VISION.md` — the why and the long-term direction.
2. `docs/roadmap.md` — current phase and the next bounded task.
3. `docs/concepts/*.md` — the concept you are touching.
4. `git log --oneline -20` — recent work.

## Workflow

inspect → plan → implement → test → review → document → commit → repeat.

Before committing run:

```bash
npm run lint && npm test && npm run build && npm run format:check
```

## Branching and deployment

- Trunk-based: work lands on `main` only. No long-lived feature branches.
- Every push to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`), so `main`
  must always pass lint, tests and build.

## Versioning

- SemVer `MAJOR.MINOR.PATCH`. While `0.x`: a roadmap phase = minor bump, fix = patch bump.
- On release: bump `package.json` `version`, add a `CHANGELOG.md` section, commit
  `chore(release): vX.Y.Z`, tag `vX.Y.Z`.
- Conventional commit prefixes: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.

## Code rules

- Watch concepts live in `src/watches/<concept-id>/` and stay self-contained
  (`metadata.ts`, `config.ts`, time math, 3D component).
- Pure time math stays framework-free and unit tested.
- Generic viewer code (`src/features/viewer`, `src/three`) must not import a specific concept.
- Small components, explicit types, no premature plugin frameworks or backends.
- Exported models are visual models only — never imply manufacturing accuracy.

## Adding a watch concept

1. Create `src/watches/<id>/` with `metadata.ts`, `appearance.ts` (defaults), the R3F model
   (dial units, reads time from `useTimeStore.getState().now()` in `useFrame`) and `index.ts`
   exporting `defineConcept({...})` with a lazy `Model`.
2. Put pure time → geometry math in its own file with unit tests.
3. Register it in `src/watches/registry.ts`.
4. Document it in `docs/concepts/<id>.md`.
5. Reuse `src/three/parts` (case, crystal) unless the concept needs its own body.
