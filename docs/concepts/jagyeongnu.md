# Watch 011 — Jagyeongnu (자격루, 自擊漏)

- **Origin:** collaborative — water-clock idea from the user; wrist adaptation and GPU fluid by AI
- **Feasibility:** conceptual
- **Displays:** 시진 (two-hour period) with 초/정, minutes as water level, seconds as drops

## Core idea

After Jang Yeong-sil's self-striking water clock of 1434. A drop falls from the reservoir
(파수호) every second; the inflow vessel (수수호) fills over one 시진 and the level is read
against minutes (0–120) and the eight 각. At the end of the 시진 the vessel siphons empty and the
plaque flips to the next zodiac hour, as the original's wooden figures announced it.

## Water: Navier–Stokes on the GPU

`src/three/fluid/StableFluid.ts` is a reusable implementation of Jos Stam's _Stable Fluids_
(1999): semi-Lagrangian advection, divergence, Jacobi pressure solve (warm-started), gradient
subtraction, with half-float ping-pong render targets. A `liquidHeight` uniform turns the region
above the free surface into air. Each drop is a downward velocity + dye splat at the surface,
so the vortex pairs you see are solved, not animated.

## Math (`waterClock.ts`, tested)

시진 boundaries start at 23:00 (자시); eight 각 of 15 minutes; 4-second siphon flush; drops
land at 55 % of each second.

## Notes

- Nearest reference: HYT (capillary liquid display). This concept keeps the Joseon logic and
  time system rather than a fluid hand.
- GLB export replaces the water shader with a flat water colour (`userData.exportColor`).
