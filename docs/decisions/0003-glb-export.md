# 0003 — Client-side GLB export

**Status:** accepted

The viewer exports the watch exactly as shown (current appearance and current time) with
three.js `GLTFExporter` in binary mode. Only the model root group is exported, so lights,
environment, controls and UI are excluded by construction.

- Units: models are authored in dial units; the export root is scaled to metres
  (dial radius 100 → 20 mm, roughly a 46 mm case).
- Canvas dial textures are embedded as PNG.
- The root node carries `extras` with concept id, app version, export time, appearance and
  the disclaimer: **visual model only, not mechanically accurate, not for manufacturing.**
