import type { WatchMetadata } from '../../types/watch'

export const numeralRingMetadata: WatchMetadata = {
  id: 'numeral-ring',
  number: '002',
  name: 'Fixed Beam',
  tagline: 'The pointer stands still. Time turns beneath it.',
  description:
    'A rotating numeral ring interpretation. Nothing on this dial points at the time: a single luminous beam is fixed at twelve, and the numerals themselves rotate underneath it. An inner ring carries the hours, an outer ring the minutes, and a small central disc the seconds.',
  readingHint: 'The numbers turn — read them under the beam at 12.',
  howToRead: [
    'Read every value at the beam at twelve o’clock.',
    'Inner ring: the hour numeral centred under the beam.',
    'Outer ring: the minute value under the beam.',
    'Centre disc: the seconds value under the beam.',
    'Rings turn anticlockwise so values advance clockwise past the beam; the hour ring jumps on the hour.',
  ],
  experimental:
    'Inverts the moving part: the scale moves, the index does not. Mechanically close to existing disc displays; the experiment is in making the whole dial the moving part.',
  category: 'Rotating Ring',
  createdAt: '2026-10-05',
  origin: {
    type: 'collaborative',
    note: 'Prompt from the project vision; reading system designed by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'plausible',
}
