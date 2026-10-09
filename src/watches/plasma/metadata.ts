import type { WatchMetadata } from '../../types/watch'

export const plasmaMetadata: WatchMetadata = {
  id: 'plasma',
  number: '014',
  name: 'Plasma',
  tagline: 'No filament tells the time. Their afterglow does.',
  description:
    'A gas-discharge chamber under the crystal. Violet filaments crackle from a glowing core to two electrode rings, and each ring is coated with phosphor. The filaments never hold still: every one of them strays tens of degrees from the time, flickering like the arcs in a plasma globe. But they are drawn towards the hour on the inner ring and the minute on the outer one, and the phosphor keeps a fading memory of every strike. Over a few seconds the glow piles up where the strikes land most often — and that is the time.',
  readingHint:
    'Hour: the brightest glow on the inner ring. Minute: the brightest glow on the outer.',
  howToRead: [
    'Ignore the individual filaments; they wander ±15° and more.',
    'Hour: the brightest part of the inner phosphor ring, against the numerals just outside it.',
    'Minute: the brightest part of the outer phosphor ring, against the minute scale on the rim.',
    'Touch the crystal (or hover over it) and filaments reach up to your finger, as on a plasma globe; they land on the glass, so the reading does not change.',
    'The glow fades in about five seconds, so it always shows the last few seconds of strikes. When you scrub the time quickly, the glow trails behind like a comet tail.',
  ],
  experimental:
    'Discharge timepieces exist where each hand is a glowing discharge in its own chamber (US 6,919,688), and UV clocks write the time on phosphor (Analumi, UV plot clocks). Here no single discharge points at the time: the filaments are random, and the reading is a statistic — the density of strikes integrated by the phosphor’s afterglow. A real version would bias the filaments with electrode segments under the rings; it is a visual model, not a safe wrist device.',
  category: 'Experimental',
  createdAt: '2026-10-08',
  origin: {
    type: 'ai',
    note: 'From the research backlog (plasma, night-only); reworked after the precedent check and built by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: false },
  feasibility: 'conceptual',
}
