import type { WatchMetadata } from '../../types/watch'

export const shearsMetadata: WatchMetadata = {
  id: 'shears',
  number: '004',
  name: 'Shears',
  tagline: 'One gesture, two values: where it points, and how far it opens.',
  description:
    'A pair of scissors replaces the hands. The direction the closed blades point is the hour; how far the blades have opened is the minute. The pair closes with a snap at the top of every hour and slowly opens again. Seconds are a bead sliding out along the handles.',
  howToRead: [
    'Hour: the gold tip on the bisector of the blades points at the hour on the outer ring.',
    'Minutes: each blade tip points at the same minute value on the scale that turns with the blades (0 closed, 60 fully open).',
    'Seconds: the red bead slides from the pivot out along the handles once a minute.',
  ],
  experimental:
    'Encodes time in the relative angle between two parts instead of an absolute position. Mechanically a differential linkage: the blade pair rotates with the hour wheel while a cam opens it over the hour and snaps it shut.',
  category: 'Linkage',
  createdAt: '2026-10-05',
  origin: {
    type: 'ai',
    note: 'Generated from the relative-angle gap in docs/research/watch-references.md.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'plausible',
}
