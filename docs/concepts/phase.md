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

## Math (`phase.ts`, `wave.ts`, tested)

- `focusPhases(F, λ)`: `φₖ = −k·|F − pₖ|` with `k = 2π/λ`. `field` / `brightestAngle` are the
  free-space model (a normalised sum of phasors): tests check that the focus has amplitude
  1, that the brightest point on each ring reads the time within 0.5°, and that elsewhere on
  the ring the amplitude stays below 0.45.
- **The dial runs the wave equation itself** (`wave.ts`): `u_tt = c²∇²u − γu_t + sources` on
  a square grid over the dial (leapfrog, 5-point Laplacian), `c = λ·f`, a hard wall (`u = 0`)
  at the case and damping `γ = 0.08 /s`. The emitters are point forces on their grid cells,
  driven at 1 Hz with focusing delays measured from those cells. Waves reflect off the case
  and fade; the interference of direct and reflected waves is what you see.
- Tests run the solver and read the time back from the running amplitude: within 2.5° on the
  hour ring (160² grid, 12 s) and 2° on the minute ring (256², 18 s); the wall holds (nothing
  outside it, nothing blows up), and with the emitters off the energy stays in and only the
  damping takes it.
- Display (`writeCrests`): crests of the instantaneous wave at full contrast, weighted by
  (amplitude ÷ focus amplitude)², with the 1/√r spreading near the emitters discounted so the
  eye goes to the focus.
- The waves run on the watch's own time: they hold still while paused, and fast-forward
  plays at most three steps per frame. Like a real array, the foci need a few seconds to
  re-form after a jump; on mount the solver runs its warm-up (12 s / 18 s of wave time) fast
  over the first frames, so the waves visibly spread out from the emitters.

## Rendering

Two additive planes, each showing one field (greyscale crests tinted by the material colour,
pushed into HDR so the foci bloom). On WebGL and WebGPU-on-WebGL2 the CPU solver uploads a
`DataTexture` (`waveField.ts`). On the WebGPU backend the same scheme runs in compute
shaders on finer grids (256² / 384², `waveCompute.ts`): leapfrog, emitter forces, running
power, a ring-peak reduction (atomic max on float bits) and a kernel that writes the crests
into a storage texture — nothing returns to the CPU. Verified off-screen: CPU and GPU fields
focus on the same point with the same brightness.

## Precedent

Ripple clocks exist, but there the water is stirred by moving hands (Hamon) or the ripples
are decoration (Tokyoflash water-ripple concept, ripple watch faces). Phased arrays are
everyday engineering, but no timepiece that tells the time with a phased-array focus was
found (October 2026).

## Next

A touch on the crystal as a third source; emitters that can be switched off one by one to
show how the focus degrades.
