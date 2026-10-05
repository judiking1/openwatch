# Watch 003 — Eclipse

- **Origin:** collaborative — prompt from the vision document, aperture design by AI
- **Feasibility:** plausible
- **Displays:** hour, minute, second

## Core idea

Time as negative space. A glowing face is covered by two dark discs that rotate like
hands. Each disc has one round aperture; you read the time from what the light reveals.

## How to read it

- Inner disc (hours) — the hour numeral glowing through the aperture.
- Outer ring (minutes) — the minute tick visible through the smaller aperture.
- Centre — a dark moon orbits a small sun once a minute; its position shows the seconds
  and the overlap changes continuously like an eclipse.

## Geometry

`apertureDiscShape` builds an annulus with a centre hole and one aperture at 12 o'clock;
the disc is rotated by the hand angle. Constants live in `src/watches/eclipse/geometry.ts`.

## Open questions

- A crescent-shaped minute aperture could read more like a moon phase.
- Is the seconds eclipse readable enough, or purely decorative?
