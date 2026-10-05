# Watch 003 — Eclipse

- **Origin:** collaborative — prompt from the vision document, aperture design by AI
- **Feasibility:** plausible
- **Displays:** hour, minute, second

## Core idea

Time as negative space. A glowing face is covered by two dark discs that rotate like
hands. Each disc has one round aperture; you read the time from what the light reveals.

## How to read it

- Inner disc (hours) — a round aperture frames one whole hour numeral. The disc **jumps**
  on the hour; a sweeping aperture showed half of the next numeral and 7:45 read as "8".
- Outer ring (minutes) — a curved ±18° window shows the minute ticks and at least one
  five-minute numeral; read the value at the notch in the middle of the window.
- Centre — a dark moon orbits a small sun once a minute; its direction against the tick
  ring around the sun shows the seconds and the overlap changes like an eclipse.

## Geometry

`apertureDiscShape` builds an annulus with a centre hole and one aperture at 12 o'clock;
the disc is rotated by the hand angle. Constants live in `src/watches/eclipse/geometry.ts`.

## Open questions

- Is the seconds eclipse readable enough, or purely decorative?
