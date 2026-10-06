import type { WatchMetadata } from '../../types/watch'

export const marbleMetadata: WatchMetadata = {
  id: 'marble',
  number: '007',
  name: 'Marble',
  tagline: 'Nothing points. Gravity finds the time.',
  description:
    'Two nested dishes hang in gimbals. The movement never touches the marbles: it only tilts each dish so that its lowest point faces the time. The marbles roll there on their own — and when time is sped up they slosh, overshoot and settle like real weights.',
  readingHint: 'Each marble rolls to the lowest point of its dish: outer = hour, inner = minutes.',
  howToRead: [
    'Outer dish: the large marble rests at the hour.',
    'Inner dish: the small marble rests at the minutes.',
    'Seconds are not shown — the dishes move too slowly to feel them.',
  ],
  experimental:
    'Time is expressed as a slope, not a position: the indicator is free and only obeys gravity. In a real watch the wearer’s wrist angle would add to the tilt; the dishes would need a pendulum-referenced gimbal.',
  category: 'Kinetic',
  createdAt: '2026-10-06',
  origin: {
    type: 'ai',
    note: 'From the "tilting dish" backlog entry; nearest references are Congreve’s rolling-ball clock (tilt as escapement) and Maurice Lacroix Aikon Mercury (gravity hands).',
  },
  timeDisplay: { hour: true, minute: true, second: false },
  feasibility: 'conceptual',
}
