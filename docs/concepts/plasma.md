# Watch 014 — Plasma

- **Origin:** AI — from the research backlog (_plasma_ and _night-only_), reworked after the
  precedent check
- **Feasibility:** conceptual (visual model; not a safe wrist device)
- **Displays:** hour and minute as the brightest afterglow on two phosphor rings; no seconds

## Core idea

A discharge chamber under the crystal. Filaments crackle from a glowing core electrode to
two electrode rings: three to the inner (hour) ring, four to the outer (minute) ring. No
filament points at the time — each one wanders, flickering like the arcs in a plasma globe
— but they are pulled towards the hour and the minute. Both rings are coated with phosphor
that remembers every strike for a few seconds. Where strikes land most often, the glow
piles up: the reading is a statistic, integrated by the afterglow.

## How to read it

- Ignore the filaments.
- **Hour:** the brightest part of the inner (pink) ring, against the numerals outside it.
- **Minute:** the brightest part of the outer (cyan) ring, against the minute scale.
- The afterglow lasts about five seconds. When the time is scrubbed fast the glow lags
  behind as a comet tail — the phosphor's memory made visible.

## Math (`plasma.ts`, tested)

- Each filament's offset from the time is an Ornstein–Uhlenbeck process (`wander`):
  correlation time 0.35 s, stationary spread 18° (hour) / 16° (minute). Updated exactly
  (`x ← x·e^{−dt/τ} + σ·√(1 − e^{−2dt/τ})·N(0,1)`), so the spread does not depend on the
  frame rate. A test checks the long-run mean and spread.
- Each frame every filament charges a 3° gaussian spot on its band (`charge`, 240 bins,
  wrapping across 12), and the band decays with a 5 s afterglow (`decay`).
- `steadyPeak` is the expected peak charge (`n·τ·w/√(σ² + w²)`); the display normalises by
  it. `peakAngle` reads a band (circular mean around the brightest 60° window). Tests run 30
  s of strikes and read the time back within 9° (hour, ≈ 18 min of hour hand) and 6°
  (minute, 1 min) even though single filaments stray by ±σ.
- `filamentPath` draws a jagged path (random walk across the line, pinned at both
  electrodes), redrawn every frame.

## Rendering

- Filaments: quad-strip ribbons rewritten every frame, a violet additive halo and a white
  core (HDR, unlit) that the stage bloom picks up (`postFx.bloom`, threshold 1).
- Phosphor: one instanced additive tile per bin with brightness in the instance colour, so
  the band colour stays a material uniform. Works on both renderers.
- On mount the bands are pre-run for 15 s, so the glow is there when the watch appears.

## Strikes and sound

About five times a second a strike flashes every filament core well above white (the bloom
flares) and you hear a crackle: two or three very short high clicks (`crackle` sound
profile). Both come from `randomEvents` in `utils/random.ts`, a pure function of the
watch's time, so the flash and the sound land on the same instants without sharing any
state — and both pause, scrub and fast-forward with the watch.

The filaments bend in 3D: besides the sideways kinks, each one gets a vertical random walk
(pinned at both electrodes) and an arc height that changes every frame, so seen from an
angle they climb and fall like the arcs in a plasma globe.

## Touch

As on a plasma globe, touching the crystal (or hovering over it with a mouse) pulls two
extra filaments up from the core to the glass under the finger (`touchTarget`, an invisible
hit disc under the crystal marked `userData.helper`). They end on the glass, not on a
phosphor ring, so they never change the reading.

## Precedent

Discharge clocks where each hand is a glowing discharge in its own chamber exist (US
6,919,688), so "a filament that points at the time" was not new. UV clocks that write the
time on phosphor exist too (Analumi, UV plot clocks), which retired _night-only_ as a
separate concept. What remained new is the combination: random filaments whose reading only
exists statistically, integrated by the afterglow. No such timepiece was found (October
2026).

## Next

Branching filaments (short forks that die out in the gas).
