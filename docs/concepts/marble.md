# Watch 007 — Marble

- **Origin:** AI — "tilting dish" backlog entry
- **Feasibility:** conceptual
- **Displays:** hour, minute (no seconds)

Two nested dishes hang in gimbals. The movement only tilts each dish so its lowest point
faces the time; a free marble rolls there under gravity. Outer dish = hour, inner = minutes.

`src/watches/marble/marble.ts` integrates the marble as a damped pendulum in its groove
(fixed 240 Hz sub-steps), so at high time speeds the marbles slosh and overshoot like real
weights. Nearest references: Congreve rolling-ball clock (tilt as the escapement, not the
display) and Maurice Lacroix Aikon Mercury (gravity-assisted hands).
