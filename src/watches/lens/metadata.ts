import type { WatchMetadata } from '../../types/watch'

export const lensMetadata: WatchMetadata = {
  id: 'lens',
  number: '008',
  name: 'Lens',
  tagline: 'The scale itself swells where the time is.',
  description:
    'There is no hand and no aperture. An invisible lens travels round the dial and the printed scale swells as it passes: the current hour numeral grows large, the minute bars rise into a wave that peaks at the minute, and a ripple of dots circles the centre with the seconds.',
  readingHint: 'Read whatever is biggest: the largest numeral, the tallest bar.',
  howToRead: [
    'Hour: the single largest numeral (it hands over on the hour).',
    'Minutes: the peak of the wave of bars on the outer ring, against the five-minute numerals that swell with it.',
    'Seconds: the swelling dots round the centre.',
  ],
  experimental:
    'Size as the encoding instead of position or pointer. Physically it suggests a dial of flexible elements or a liquid-lens crystal; nearest reference is the tactile Relevo concept, which moves bumps rather than magnifying the scale.',
  category: 'Optical',
  createdAt: '2026-10-06',
  origin: { type: 'ai', note: 'From the "size encoding" backlog entry.' },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'conceptual',
}
