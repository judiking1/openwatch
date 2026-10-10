# Watch 013 — Chladni

- **Origin:** collaborative — reworked by AI from the "Magnetic Sand" proposal
  (`docs/future-concepts-and-features.md`)
- **Feasibility:** conceptual
- **Displays:** hour as a still diameter, minute as a still circle, seconds as a shimmer

## Core idea

A plate vibrates under four thousand grains of sand. Grains are kicked where the plate shakes
and come to rest where it does not — Ernst Chladni's 1787 sand figures. The drive is tuned so
two lines stay still: a diameter pointing at the hour (its hour end marked by the brass
exciter on the rim) and a circle whose radius grows from the centre over the hour. Nothing
pushes the sand into a shape; it only reveals where the plate is still.

## How to read it

- **Hour:** the sand line from the centre to the brass exciter, against the numerals on the rim.
- **Minutes:** the sand circle against the faint minute circles (labelled every five, up and
  down the 12–6 radius).
- **Seconds:** the drive pulses at the start of every second and the sand shimmers.
- At the top of the hour the circle shrinks back to the centre and the sand flows in.

## Physics (`sand.ts`, tested)

- Energy `E = A·B / (A + B + c)` with `A = s²`, `B = d²`: `s` is the normalised distance across
  the still diameter, `d` the distance from the still circle. It is zero on both lines and
  behaves like the smaller squared distance, so the sand gathers sharply on both lines
  instead of pooling where they cross. This is a stylised (1,1)-like mode, not an exact Bessel
  eigenmode.
- Each grain drifts down `∇E` and gets a random kick proportional to `√E` (stronger during
  the pulse); grains leaving the plate are reflected. Tests check the gradient against finite
  differences and that scattered sand loses >80 % of its energy within four seconds.
- **Piling** (grain–grain contact, simplified): every step the grains are binned into a
  96 × 96 height grid (`depositSand`, a 3 × 3 blur; the total sand volume is fixed, so 4 000
  and 32 768 grains build the same ridges) and slide down its slope (`PILE`). Ridges get a
  width and a height instead of collapsing into a line. Tests check that the grid holds the
  whole volume and that piled ridges are wider but still on the still lines.
- **Angle of repose:** the pile only slides where it is steeper than 34° (`REPOSE`), so
  ridges hold a natural slope instead of flattening out. A test checks that loose sand
  stacks far steeper than that and piled sand slides back to near it.
- **Grain contacts:** a neighbour grid one grain diameter wide (linked lists per cell on the
  CPU, fixed slots filled with an atomic counter on the GPU) pushes touching grains apart,
  half the overlap each. The sand is a 3D pile drawn on a 2D plate, so contacts loosen the
  ridges rather than forbid overlap entirely (the heightfield carries the stacking). Grains
  rest on top of the pile (their height is read from the grid).
- On mount the sand is pre-settled (180 steps) to the current time, so the figure is already
  drawn when the watch appears.

## Precedent

Particles forming numerals (Ferrolic, INK-MAGNETIC) and iron filings moved by hidden magnets
to mark the hour and minute (Moongchi Clock, iF 2022) exist, so the original proposal was
reworked. No timepiece that reads time from Chladni nodal lines was found (October 2026).

## Renderers

- **WebGPU backend:** 32 768 grains simulated by a compute shader (`sandCompute.ts`, TSL
  `Fn().compute()` over a storage buffer) and drawn as one instanced mesh whose vertex stage
  reads the same buffer, so the grains never return to the CPU. The kernel mirrors
  `stepSand` (energy, gradient, pulse kick, tilt slide, reflection at the rim) with a hash
  in place of the CPU's random numbers. Verified off-screen against the CPU model: mean
  energy after settling 0.034 (GPU) vs 0.032 (CPU).
  Piling runs there too: an atomic-add pass counts grains into the grid, a blur pass turns
  counts into heights, and the step kernel reads the slope.
- **WebGL and WebGPU-on-WebGL2:** 4 000 grains on the CPU (`sand.ts`).
- **Heightfield:** the piled sand is drawn as a lit surface over the grid
  (`heightfield.ts`), with the loose grains on top. On the CPU path its vertices and normals
  are rewritten each frame; on the compute path the vertex shader reads the heights from the
  storage buffer and derives normals from their differences — no readback.

## Next

Sand that spills off the plate edge and is refilled; per-grain height for true 3D stacking.
