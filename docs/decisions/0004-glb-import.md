# 0004 — GLB import and the clock-driven naming convention

**Status:** accepted

`#/lab/import` (Model Lab) loads any binary glTF with three.js `GLTFLoader`, fits it to the
stage by its width, and drives parts by **name**:

- A node named `hour`, `minute` or `second` (or prefixed `hour_` / `hour.` …,
  case-insensitive) rotates **clockwise about the model's up axis** by the hand angle,
  starting from its pose in the file. Model hands pointing at 12 with the pivot at the dial
  centre.
- Up axis: `+Z` for this app's exports (dial faces +Z), `+Y` for Blender and most DCC tools.
- Exports from this app carry their metadata in the root node `extras`
  (`concept`, `appVersion`, `appearance`, `disclaimer`); hands in those files are frozen at
  the export time, so their rest pose is reset to 12 o'clock on import.

Concepts only name a part `hour` / `minute` / `second` when it follows those semantics
(Orbital Hands indicators, Eclipse discs, Optical Lever beams). Counter-rotating scales and
other moving parts use descriptive names (`hour-ring`, `water`, `needle-shadow` …).

## Export side (`prepareForExport`)

The exporter works on a sanitised clone: custom shaders become standard materials
(`material.userData.exportColor`), fat lines become line segments, back-face-only surfaces
become double-sided, and `mesh.userData.exportFillFraction` bakes a shader-clipped liquid
level into the mesh transform. Every concept round-trips (export → import) without errors.
