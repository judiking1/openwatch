import type { WatchMetadata } from '../../types/watch'

export const orbitalHandsMetadata: WatchMetadata = {
  id: 'orbital-hands',
  number: '001',
  name: 'Orbital Hands',
  tagline: 'The hands live outside. The numerals live inside.',
  description:
    'A traditional dial turned inside out. Numerals sit near the centre and never move; the hour, minute and second indicators have no central pivot and instead orbit the dial on their own tracks, each pointing inward at the time it shows.',
  readingHint: 'Follow each orbiting pointer inward to the numerals.',
  howToRead: [
    'Inner track: the short, heavy hour indicator points at the hour numeral.',
    'Middle track: the minute indicator points at the minute (numeral × 5).',
    'Outer track: the thin red second indicator sweeps around the edge.',
  ],
  experimental:
    'Indicators that orbit without a central arbor. A real movement would need ring gears or a rotating bezel per track.',
  category: 'Orbital',
  createdAt: '2026-10-05',
  origin: { type: 'human', note: 'The concept that started the project.' },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'conceptual',
}
