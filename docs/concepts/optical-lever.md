# Watch 009 — Optical Lever

- **Origin:** collaborative — laser idea from the user, optical-lever mechanism by AI
- **Feasibility:** plausible
- **Displays:** hour, minute, second

Three lasers fire from six o'clock into three stacked mirrors at the centre; the reflected
beams are the hands. A mirror rotated by θ deflects its reflection by 2θ, so each mirror
turns at half the speed of its beam (`mirrorNormalAngle(θ) = 90° + θ/2`, proven by
`optics.test.ts` with an explicit reflection). Laser projection watches exist (Aurora,
Laser Timing) but project numbers; here reflection itself is the gear train.

## WebGPU

With `?renderer=webgpu` the concept requests bloom (`postFx.bloom` in `index.ts`): the
beams are unlit HDR colours, so a linear threshold of 1.2 lets only them glow.
