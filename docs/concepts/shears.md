# Watch 004 — Shears

- **Origin:** AI — from the "relative angle" gap in `docs/research/watch-references.md`
- **Feasibility:** plausible
- **Displays:** hour, minute, second

## Core idea

A pair of scissors replaces the hands. One gesture carries two values: the **direction** of
the pair is the hour, the **opening** of the pair is the minute. The blades close with a snap
at the top of every hour and open slowly again.

## How to read it

- Hour — the gold tip on the bisector points at the hour numeral on the fixed outer ring.
- Minutes — a scale turns with the pair; value _m_ is printed at ±1.5·*m*° from the bisector,
  so both blade tips point at the same minute value (0 = closed, 60 = straight line).
- Seconds — the red bead slides from the pivot out along the handles once a minute.

## Time math

`src/watches/shears/shears.ts`: bisector = hour angle, opening = minutes × 3°,
blades = bisector ± opening / 2. `readShears` inverts the pose from the two blade angles
alone, proving the display is unambiguous.

## Mechanism sketch

The pair is a differential: both blades ride on the hour wheel, and a heart-shaped cam on
the minute arbor spreads them symmetrically, dropping off the cam at the hour to snap shut.
