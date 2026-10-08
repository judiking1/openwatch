# Watch 015 — Phase

- **Origin:** AI — from the research backlog (_phase_)
- **Feasibility:** conceptual
- **Displays:** hour and minute as the foci of two wave fields; seconds on a small hand

## Core idea

Thirty-two fixed emitters on a ring of radius 20 send out ripples. Each is driven with a
delay equal to its distance from a chosen point, so every ripple arrives there in step:
the waves add up to a bright focus there and mostly cancel elsewhere. This is how phased
arrays steer radar beams and how ultrasound transducers focus. Long waves (λ = 12) are
focused on the hour ring (radius 48), short waves (λ = 6) on the minute ring (radius 74).
As time passes only the delays change; the foci glide round the dial with nothing moving.

## How to read it

- **Hour:** the bright warm spot on the inner ring, against the numerals.
- **Minute:** the bright cool spot on the outer ring, against the minute scale.
- **Seconds:** the red hand on the centre cap. Crests leave the emitters once a second, so
  the foci also flash with the seconds.

## Math (`phase.ts`, tested)

- `focusPhases(F, λ)`: `φₖ = −k·|F − pₖ|` with `k = 2π/λ`.
- `field(x, y)`: the normalised complex sum `(1/N)·Σ e^{i(k·dₖ + φₖ)}`; its modulus is 1 at
  the focus. Tests check that, that the brightest point on each ring reads the time back
  within 0.5°, and that elsewhere on the ring the amplitude stays below 0.45 (no grating
  lobe takes over).
- The wave shown is `Re(F·e^{−iωt})` at 1 Hz. It is split into a slow part — the complex
  field over a 128² grid, recomputed only when a focus has moved 0.3–0.4° — and a fast part
  per frame (`writeWave`: two multiplies per cell). Crests are drawn at full contrast
  everywhere and weighted by the local amplitude², so ripples are visible but the foci win.

## Rendering

Two additive planes with a `DataTexture` each (greyscale crests, tinted by the material
colour, so the colour pickers never touch the texture). The colours are pushed into HDR
so that only the foci cross the bloom threshold. Classic materials only: both renderers.

## Precedent

Ripple clocks exist, but there the water is stirred by moving hands (Hamon) or the ripples
are decoration (Tokyoflash water-ripple concept, ripple watch faces). Phased arrays are
everyday engineering, but no timepiece that tells the time with a phased-array focus was
found (October 2026).

## Next

Simulate the waves on the GPU (a wave equation on a compute grid) so that they reflect off
the case wall, and let the user's touch add a third source.
