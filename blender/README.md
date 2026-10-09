# Blender assets (Phase 8)

Watch-body parts that procedural three.js geometry handled poorly — a smooth tapered strap
with stitching, a link bracelet, a fluted crown and bevelled lugs — are modelled in Blender
by a script and shipped as small GLBs in `src/assets/models/`.

```bash
pip install bpy            # Blender as a Python module (5.x, Python 3.11)
npm run assets             # = python3 blender/generate_assets.py
```

- The script is the source of truth; the GLBs are committed so that building the app never
  needs Blender.
- Everything is authored in dial units (dial radius 100, dial plane z = 0, watch facing +z,
  12 o'clock along +y) and exported Z-up, so three.js reads it without conversion.
- Only geometry is exported. `WatchCase` applies the case and strap materials, so colour
  pickers and strap styles keep working (`metal` uses the bracelet, `leather` and `fabric`
  the strap).
- `src/three/parts/bodyAssets.test.ts` checks the exported bounds against what `WatchCase`
  expects. Run it after regenerating.
- Visual models only: proportions follow this app's procedural body, not a real watch.
