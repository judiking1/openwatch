# Watch 006 — Cipher

- **Origin:** AI — from the "legible only where things line up" gap in `docs/research/watch-references.md`
- **Feasibility:** conceptual
- **Displays:** hour, minute (seconds deliberately omitted)

## Core idea

Every numeral is always on the dial, sliced into three radial bands. Each band is a separate
ring with its own scrambled order, so the dial reads as broken glyphs. Like a combination
lock, the rings turn by different amounts until the three slices of the right numeral line up
in one window at twelve — the only place where anything is whole.

## How to read it

Read the window at twelve from the outside in: hour, minute tens, minute units
(`7 / 4 / 5` = 7:45). Every minute the units rings re-dial; on the hour all nine move.

## Math

`src/watches/cipher/cipher.ts` holds three groups (hour 1–12, tens 0–5, units 0–9), each with
three fixed permutations. `ringTargets` turns each ring so the slot holding the value is at
twelve; rings travel the shortest way at a fixed speed, so they arrive at different times.
`cipher.test.ts` proves the three slices agree **only** in the window for every value.

## Why no seconds

The concept is about a moment of alignment; a seconds display would add constant motion and
dilute it. The minute re-dial is the heartbeat.
