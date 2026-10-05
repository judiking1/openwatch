import type { WatchMetadata } from '../../types/watch'

export const eclipseMetadata: WatchMetadata = {
  id: 'eclipse',
  number: '003',
  name: 'Eclipse',
  tagline: 'Time is the light that gets through.',
  description:
    'A glowing dial almost completely covered by two dark rotating discs. There are no hands: each disc has a single round aperture, and time is read from what the light reveals. At the centre a small moon circles a sun, eclipsing it differently every second.',
  howToRead: [
    'Inner disc: the hour marker glowing through the round aperture.',
    'Outer ring: the minute tick visible through the outer aperture.',
    'Centre: the moon’s position around the sun shows the seconds.',
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
