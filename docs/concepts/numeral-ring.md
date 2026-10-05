# Watch 002 — Fixed Beam (Rotating Numeral Ring)

- **Origin:** collaborative — prompt from the vision document, reading system by AI
- **Feasibility:** plausible
- **Displays:** hour, minute, second

## Core idea

Invert what moves. A translucent luminous beam is fixed at twelve o'clock; nothing on
the dial points anywhere. The numerals rotate beneath the beam instead.

## How to read it

Everything is read at the beam.

- Inner ring — hour numerals 1–12. The ring **jumps** on the hour so one numeral sits centred
  under the beam for the whole hour (a sweeping ring made 7:45 read as "8").
- Outer ring — minutes 00–55 with minute ticks, sweeping continuously.
- Centre disc — seconds 00–50 with ticks, sweeping under the beam.

Rings turn anticlockwise so values advance clockwise past the beam.

## Time math

Each ring rotates by minus the corresponding hand angle (`src/watches/numeral-ring/rings.ts`),
so the mark printed at the current value's angle lands at 0°.

## Notes

- Numerals are drawn tangentially so the one under the beam always reads upright.
- `RingGeometry` UVs span the ring's outer radius; the ring texture extent must match it.
