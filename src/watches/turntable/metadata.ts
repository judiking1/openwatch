import type { WatchMetadata } from '../../types/watch'

export const turntableMetadata: WatchMetadata = {
  id: 'turntable',
  number: '005',
  name: 'Turntable',
  tagline: 'The watch is the hour hand.',
  description:
    'The whole head — case, crown, bezel and dial — sits on a bearing between the lugs and turns on the strap. A fixed index on the strap points at the hour engraved on the bezel; on the hour the entire watch makes a short twelfth of a turn. Inside, ordinary hands keep the minutes and seconds against the dial’s own, now tilted, scale.',
  readingHint: 'The whole watch turns — read the hour at the strap index.',
  howToRead: [
    'Hour: the bezel numeral under the gold index on the strap at twelve.',
    'Minutes: the long hand against the minute numerals printed on the turning dial.',
    'Seconds: the thin red hand against the same scale.',
  ],
  experimental:
    'Moves the reference frame instead of the indicator: the reading happens at the strap, outside the dial, and the crown travels round the wrist during the day.',
  category: 'Kinetic',
  createdAt: '2026-10-05',
  origin: {
    type: 'ai',
    note: 'Generated from the "what moves: the case itself" gap in docs/research/watch-references.md.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'plausible',
}
