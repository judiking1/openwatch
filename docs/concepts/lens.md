# Watch 008 — Lens

- **Origin:** AI — "size encoding" backlog entry
- **Feasibility:** conceptual
- **Displays:** hour, minute, second

No hand and no aperture: an invisible lens travels round the dial and the printed scale
swells as it passes. The largest numeral is the hour (focus on the jumping hour so 7:45 reads
7), the minute bars rise into a wave that peaks at the minute, and dots ripple with the seconds.

`src/watches/lens/lens.ts`: Gaussian swell by angular distance; tests prove a single largest
numeral and tallest bar. Nearest reference: the tactile Relevo concept (moving bumps).
