import type { WatchMetadata } from '../../types/watch'

export const numeralRingMetadata: WatchMetadata = {
  id: 'numeral-ring',
  number: '002',
  name: 'Fixed Beam',
  tagline: 'The pointer stands still. Time turns beneath it.',
  description:
    'A rotating numeral ring interpretation. Nothing on this dial points at the time: a single luminous beam is fixed at twelve, and the numerals themselves rotate underneath it. An inner ring carries the hours, an outer ring the minutes, and a small central disc the seconds.',
  howToRead: [
    'Read every value at the beam at twelve o’clock.',
    'Inner ring: the hour numeral under the beam (between two numerals = between hours).',
    'Outer ring: the minute value under the beam.',
    'Centre disc: the red dot passes under the beam once a minute.',
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
