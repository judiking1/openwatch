import type { WatchMetadata } from '../../types/watch'

export const cipherMetadata: WatchMetadata = {
  id: 'cipher',
  number: '006',
  name: 'Cipher',
  tagline: 'Every numeral is on the dial. Only one of them is whole.',
  description:
    'Nine concentric rings each carry slices of numerals in a different, scrambled order, so the dial reads as broken glyphs. Like a combination lock, the rings turn by different amounts until the three slices of the right numeral line up in a single window at twelve — the only place on the dial where anything is legible.',
  readingHint: 'Only the window at 12 is legible: hour, then minutes.',
  howToRead: [
    'Read the window at twelve from the outside in: hour, then the tens and units of the minute (7 / 4 / 5 = 7:45).',
    'Everywhere else the slices never line up into a whole numeral.',
    'Seconds are deliberately not shown; every minute the inner rings re-shuffle like a lock being dialled.',
  ],
  experimental:
    'Legibility as a moment of alignment: the information is always on the dial, scrambled, and the movement’s job is to decode it. Mechanically nine jumping rings driven by cams with individual step counts.',
  category: 'Experimental',
  createdAt: '2026-10-05',
  origin: {
    type: 'ai',
    note: 'Generated from the "legible only where things line up" gap in docs/research/watch-references.md.',
  },
  timeDisplay: { hour: true, minute: true, second: false },
  feasibility: 'conceptual',
}
