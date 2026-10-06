import type { WatchMetadata } from '../../types/watch'

export const opticalLeverMetadata: WatchMetadata = {
  id: 'optical-lever',
  number: '009',
  name: 'Optical Lever',
  tagline: 'Three lasers, three mirrors, no hands.',
  description:
    'Three fixed lasers fire from six o’clock into the centre, where three tiny stacked mirrors turn. Each reflected beam is a hand made of light. Because a mirror turned by θ swings its reflection by 2θ, every mirror turns at exactly half the speed of the beam it steers — the half-speed reduction a movement already has, used optically.',
  readingHint: 'Follow the reflected beams: red = hour, green = minutes, violet = seconds.',
  howToRead: [
    'Red beam: points at the hour numeral.',
    'Green beam: lands on the minute scale.',
    'Violet beam: sweeps the inner seconds ring.',
  ],
  experimental:
    'The indicator has no mass and no arbor: only the mirrors move, at half speed. Laser projection watches exist (e.g. Aurora, Laser Timing), but they project numbers; here the law of reflection is the gear train.',
  category: 'Optical',
  createdAt: '2026-10-06',
  origin: {
    type: 'collaborative',
    note: 'Laser idea from the user; optical-lever mechanism by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'plausible',
}
