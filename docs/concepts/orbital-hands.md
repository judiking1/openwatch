# Watch 001 — Orbital Hands

- **Origin:** human (the idea that started the project)
- **Feasibility:** conceptual
- **Displays:** hour, minute, second

## Core idea

Invert the traditional dial. Numerals sit near the center and stay fixed. The hour,
minute and second indicators have no central pivot: each travels around its own outer
circular track and points inward at the numeral it indicates.

## How to read it

Find the indicator on each track and follow its tip inward.

- Inner track — **hour** indicator (short, heavy), points at the hour numeral.
- Middle track — **minute** indicator (medium), points at the minute position (numeral × 5).
- Outer track — **second** indicator (thin, accent colour).

## Time math

All angles are measured clockwise from 12 o'clock, in degrees.

```text
second = (s + ms/1000) × 6
minute = (m + s/60) × 6
hour   = ((h mod 12) + m/60) × 30
```

An indicator at angle θ on an orbit of radius R sits at
`(R·sin θ, −R·cos θ)` (SVG coordinates) and is rotated so its tip faces the center.

## Open questions

- Which track ordering is most readable (hour inside vs. outside)?
- Do the indicators need visible tracks, or do they read better floating?
- Is a seconds indicator distracting on the outermost (largest) track?
