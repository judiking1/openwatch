# Watch 012 — Iris

- **Origin:** collaborative — proposed in `docs/future-concepts-and-features.md`, built by AI
- **Feasibility:** plausible
- **Displays:** minute as the size of an aperture, hour as its rotation, seconds in the pinhole

## Core idea

A nine-blade diaphragm covers the dial. Over each hour it closes from wide open
(inradius 78) to a pinhole (10), and its straight edges sweep inward across concentric
minute rings. At the top of the hour the blades snap open in 0.6 s, a retrograde jump. The
blade carrier turns once in twelve hours and a gold tip riding on blade 0 points at the
hour numerals printed outside the blades.

## How to read it

- **Minutes:** the ring the blade edges touch. Rings are drawn every minute and labelled
  every five, on their own ring, along three spokes (so a label being cut by an edge is the
  current five minutes).
- **Hour:** the gold tip against the outer numerals.
- **Seconds:** the red hand in the pinhole, always visible because the opening never closes
  below radius 10.

## Math (`iris.ts`, tested)

- `ringRadius(m) = 78 − 68·m/60`; `irisPose(t)` returns the aperture (with the eased snap),
  carrier and seconds angles; `minuteFromAperture` inverts it.
- `bladeOutline(aperture, normal)`: each blade is the circular segment of the blade disc
  (radius 86) beyond a chord at distance `aperture` along the blade normal. Nine segments
  with normals 40° apart leave a regular nine-gon whose inradius is exactly the aperture —
  the same construction as a real iris, with straight blade edges.

## Rendering

The nine segments are rebuilt in place every frame (25 vertices each); each blade carries a
dark edge strip along its chord, and the blades step up slightly in z so overlaps read like
stacked leaves. The blade group is named `minute`, the tip `hour`, the seconds hand
`second`, so the exploded view and the lume view treat them like hands.

## Precedent

Valbray EL1 (Leica) and iris concepts use a diaphragm to hide or reveal a display; none
encodes time in the aperture size (`docs/future-concepts-and-features.md`, precedent check).
