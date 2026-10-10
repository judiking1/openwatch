# Blender assets (Phase 8)

Watch-body parts that procedural three.js geometry handled poorly — a smooth tapered strap
with stitching, a link bracelet, a fluted crown, bevelled lugs, a coin-edge bezel that seats
the crystal and a caseback with engraved rings, an orbit emblem and lettering — are modelled
in Blender by a script and shipped as GLBs in `src/assets/models/`.

```bash
pip install bpy            # Blender as a Python module (5.x, Python 3.11)
npm run assets             # = python3 blender/generate_assets.py
```

- Engraving is done with boolean differences (text converted to mesh, V-shaped ring
  cutters), then the cut edges are chamfered so they catch the light. The lettering is set
  mirrored so it reads correctly from the back of the watch.
- Each export is compressed with `gltfpack -cc -noq` (meshopt, no quantisation, so the
  coordinates stay in dial units; `gltfpack` is a dev dependency). three's GLTF loader
  decodes it.
- The script is the source of truth; the GLBs are committed so that building the app never
  needs Blender.
- Everything is authored in dial units (dial radius 100, dial plane z = 0, watch facing +z,
  12 o'clock along +y) and exported Z-up, so three.js reads it without conversion.
- Only geometry is exported. `WatchCase` applies the case and strap materials, so colour
  pickers and strap styles keep working (`metal` uses the bracelet, `leather` and `fabric`
  the strap). The engraving reads "VISUAL MODEL - NOT FOR MANUFACTURE".
- `src/three/parts/bodyAssets.test.ts` checks the exported bounds against what `WatchCase`
  expects. Run it after regenerating.
- Visual models only: proportions follow this app's procedural body, not a real watch.
