import type { WatchMetadata } from '../../types/watch'

export const phaseMetadata: WatchMetadata = {
  id: 'phase',
  number: '015',
  name: 'Phase',
  tagline: 'Nothing moves. The waves meet at the time.',
  description:
    'Thirty-two fixed emitters sit in a small ring at the centre of the dial, sending out ripples. Each is driven a fraction of a wave later than its neighbour, and those delays are chosen so that every ripple arrives in step at one point: there the waves add up to a bright flash, everywhere else they mostly cancel. One set of long waves is focused on the hour ring, one set of short waves on the minute ring. As the time changes only the delays change — the bright spots glide round the dial with nothing turning.',
  readingHint:
    'Hour: the bright spot of the long waves on the inner ring. Minute: the short waves’ spot on the outer ring.',
  howToRead: [
    'Hour: where the long (warm) waves meet on the inner ring, against the numerals.',
    'Minute: where the short (cool) waves meet on the outer ring, against the minute scale.',
    'Seconds: the small hand on the centre cap; the foci also flash once a second as each crest arrives.',
    'Everything else is interference: ripples crossing and cancelling.',
    'Touch the crystal (or hover over it) to dip a finger in: rings spread from it and the foci shimmer until you let go.',
  ],
  experimental:
    'Clocks made of ripples exist, but there the water is stirred by moving hands (Hamon) or the ripples are decoration (Tokyoflash, watch faces). Here the waves themselves are the hands: a phased array — the technique behind steerable radar and focused ultrasound — focuses them on the time, and no part moves. A real dial could use ultrasonic transducers under a thin liquid film or an LED simulation; this is a visual model of the wave physics (scalar waves, no reflections).',
  category: 'Optical',
  createdAt: '2026-10-08',
  origin: {
    type: 'ai',
    note: 'From the research backlog (phase); passed the precedent check as a phased array and built by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'conceptual',
}
