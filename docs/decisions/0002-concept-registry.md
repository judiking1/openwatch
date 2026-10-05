# 0002 — Concept registry and generic viewer

**Status:** accepted

Each watch concept exports a `WatchConcept` (`src/types/watch.ts`): metadata, a default
appearance and a lazily loaded R3F `Model` component authored in dial units
(dial radius ≈ 100, dial plane at z = 0, facing +z). `src/watches/registry.ts` lists the
concepts in exhibition order.

The generic `WatchViewer` (`#/watch/:id`) renders any concept: stage, camera, lighting,
time controls and metadata. Concepts read the shared time via `useTimeStore.getState().now()`
inside `useFrame`, so time control works for every concept without extra wiring.

Models are lazy so the gallery bundle does not include three.js. No plugin framework:
adding a concept is a folder plus one line in the registry.
