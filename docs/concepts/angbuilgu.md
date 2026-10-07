# Watch 010 — Angbuilgu (앙부일구, 仰釜日晷)

- **Origin:** collaborative — Joseon sundial idea from the user; wrist adaptation by AI
- **Feasibility:** conceptual
- **Displays:** hour and 15-minute 각 by day, night watches (경) by night; season (24 절기)

## Core idea

The concave hemispherical sundial made for King Sejong in 1434, as a wristwatch. A virtual sun
follows the real sky over Hanyang (37.57° N) for the current date. The polar needle (영침)
points at the celestial pole with its tip at the centre of the sphere, so the tip's shadow is
simply −R·sun: hour lines are meridians, solar-term lines are circles of constant declination,
and one shadow shows the time **and** the season.

## How to read it

- Time — follow the hour line under the needle-tip shadow down to its large Arabic number
  (6–18 h, in the open lower bowl where the lines are widest apart); fine lines are 15 minutes.
  The 시진 characters at the top carry their clock hours (巳 `09–11`).
- Season — the curved line under the tip: 冬至 (12월) near the rim, 春秋分 (3·9월) in the
  middle, 夏至 (6월) lowest.
- Night — the sun is below the horizon; a moon bead crosses the north rim through the five
  watches, each labelled with its hours (初更 19–21 … 五更 3–5).
- Labels sit on small bowl-coloured backings so they stay legible over the engraved grid.
- **Reading guide:** the hour line under the shadow tip is the current time, but it converges
  toward the rim where the shadow usually falls. A dotted gold guide follows that same line
  (constant hour angle, varying declination) from the tip down to the number row and ends in
  a marker, so the time reads directly — also at 600× speed. It is a modern aid computed from
  the same geometry, not part of the 1434 instrument.

## Math (`sky.ts`, tested)

- Sun vector in horizon coordinates from hour angle, declination and latitude.
- Declination from a mean-sun ecliptic longitude; 24 solar terms every 15°.
- `shadowOnSphere` ray-casts any point of the needle onto the bowl (exact sphere intersection).

## Honest simplifications

Clock time is used as solar time (no longitude / equation-of-time correction). The bowl is
flattened to 24 % depth to fit a wrist; all geometry is computed on the true sphere and
flattened together, so the reading is unchanged. Night watches use fixed 19:00–05:00 bounds.
