import type { WatchMetadata } from '../../types/watch'

export const irisMetadata: WatchMetadata = {
  id: 'iris',
  number: '012',
  name: 'Iris',
  tagline: 'The minute is how far the eye has closed.',
  description:
    'A nine-blade diaphragm, like a camera aperture, covers the dial. Over each hour it closes from wide open to a pinhole, and the edge of the opening sweeps inward across concentric minute rings. At the top of the hour the blades snap open again. The whole blade carrier turns once in twelve hours, and a gold tip on one blade points at the hour.',
  readingHint: 'Minutes: the ring the blade edges touch. Hour: the gold tip on the outer ring.',
  howToRead: [
    'Minutes: the opening is a nine-sided hole; read the minute ring its straight edges just touch (0 at the rim, 55 near the centre). Labels repeat on three spokes.',
    'Hour: the gold tip on the blades points at the hour numeral outside them; it turns with the blade carrier once in twelve hours.',
    'Seconds: the short red hand in the pinhole.',
    'At the top of each hour the iris snaps fully open (a retrograde jump).',
  ],
  experimental:
    'Existing aperture watches use a diaphragm only to hide or reveal a display (Valbray EL1, iris concepts). Here the size of the opening is the minute itself and its rotation is the hour: one element carrying two values. A cam would close the blades over the hour and a spring release open them.',
  category: 'Linkage',
  createdAt: '2026-10-08',
  origin: {
    type: 'collaborative',
    note: 'Proposed in docs/future-concepts-and-features.md (another agent, via the user); passed the precedent check; built by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'plausible',
}
