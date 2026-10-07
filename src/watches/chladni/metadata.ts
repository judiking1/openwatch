import type { WatchMetadata } from '../../types/watch'

export const chladniMetadata: WatchMetadata = {
  id: 'chladni',
  number: '013',
  name: 'Chladni',
  tagline: 'Sand finds the places that stay still. Those places are the time.',
  description:
    'A plate vibrates under four thousand grains of sand. Grains are thrown about where the plate shakes and come to rest where it does not, as in Ernst Chladni’s 1787 experiments. The vibration is tuned so that two lines stay still: a diameter pointing at the hour and a circle whose radius is the minute. The sand draws them, and redraws them as they move. A pulse each second makes it shimmer.',
  readingHint: 'Hour: the sand line toward the brass exciter. Minutes: the sand circle’s ring.',
  howToRead: [
    'Hour: the straight line of sand runs through the centre; its end at the brass exciter on the rim points at the hour.',
    'Minutes: the circle of sand grows from the centre over the hour; read it against the faint minute circles (labelled every five).',
    'Seconds: the sand shimmers at the start of every second, when the drive pulses.',
    'At the top of the hour the circle shrinks back to the centre and the sand flows inward to redraw it.',
  ],
  experimental:
    'Reworked from the "Magnetic Sand" proposal, whose encoding (particles forming numerals) already exists (Ferrolic, INK-MAGNETIC, Moongchi). Here nothing pushes the sand into a shape: the plate’s still lines are the information, and the sand only reveals them. The vibration field is a stylised (1,1)-like mode — a still diameter and a still circle — rather than an exact Bessel eigenmode; the sand is simulated (drift down the energy slope, kicks where it shakes).',
  category: 'Experimental',
  createdAt: '2026-10-08',
  origin: {
    type: 'collaborative',
    note: 'Reworked by AI from the Magnetic Sand proposal in docs/future-concepts-and-features.md.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'conceptual',
}
