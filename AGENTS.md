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
