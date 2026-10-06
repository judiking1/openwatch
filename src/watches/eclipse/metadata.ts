import type { WatchMetadata } from '../../types/watch'

export const eclipseMetadata: WatchMetadata = {
  id: 'eclipse',
  number: '003',
  name: 'Eclipse',
  tagline: 'Time is the light that gets through.',
  description:
    'A glowing dial almost completely covered by two dark rotating discs. There are no hands: each disc has a single round aperture, and time is read from what the light reveals. At the centre a small moon circles a sun, eclipsing it differently every second.',
  readingHint: 'Read what the light shows through the two openings.',
  howToRead: [
    'Inner disc: the hour numeral framed by the round aperture (it jumps on the hour).',
    'Outer ring: read the minute at the small notch in the curved window; the nearest five-minute numeral is always visible.',
    'Centre: the direction of the moon against the tick ring around the sun shows the seconds.',
  ],
  experimental:
    'Time as changing negative space. Reading relies on light and occlusion rather than any pointing element.',
  category: 'Disc Display',
  createdAt: '2026-10-05',
  origin: {
    type: 'collaborative',
    note: 'Prompt from the project vision; aperture design by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'plausible',
}
