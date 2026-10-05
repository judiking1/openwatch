# Watch 005 — Turntable

- **Origin:** AI — from the "what moves: the case itself" gap in `docs/research/watch-references.md`
- **Feasibility:** plausible
- **Displays:** hour, minute, second

## Core idea

The watch is the hour hand. The whole head — case, crown, bezel, dial and hands — turns on a
bearing in a cradle carried by the lugs. A fixed gold index on the strap at twelve points at
the hour engraved on the bezel. On the hour the entire watch makes a twelfth of a turn.

## How to read it

- Hour — the bezel numeral under the gold index on the strap.
- Minutes / seconds — ordinary hands, read against the minute numerals printed on the dial,
  which is turned with the head (the reference frame moves, not the indicator).

## Time math

`src/watches/turntable/turntable.ts`: head = −jumping hour angle, hands relative to the head.
The hour jumps (with a short eased turn) so the index never sits between two numerals.

## Notes

- `WatchCase` accepts a `headRef`; the head group excludes lugs and strap so the case can turn.
- The crown travels round the wrist during the day — a physical design question for a real
  version (crown at 6 under the head, or a crownless setting through the caseback).
